#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Pages build script (project: kartarados).
#
# Which app gets built is decided by the CWD — Cloudflare runs the build
# command with the project's "root directory" as the working directory:
#
#   root directory = react (or repo root)  -> builds the React app  (react/)
#   root directory = frontend              -> builds the legacy app (frontend/)
#
# Rollback to the legacy app is a pure dashboard revert: point the root
# directory back at `frontend` (build command and output dir stay the same).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
REACT_DIR="$SCRIPT_DIR/react"

build_react() {
  echo "==> Build mode: react (node $(node --version))"

  # Fail fast on missing required build-time env vars.
  local missing=()
  [[ -n "${SUPABASE_URL:-}" ]] || missing+=("SUPABASE_URL")
  [[ -n "${SUPABASE_ANON_KEY:-}" ]] || missing+=("SUPABASE_ANON_KEY")
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "ERROR: missing required build-time env var(s): ${missing[*]}" >&2
    echo "Set them in Cloudflare Pages > kartarados > Settings > Environment variables." >&2
    exit 1
  fi

  # Bridge Cloudflare dashboard names -> Vite names: Vite only injects
  # VITE_-prefixed vars into the bundle at build time. Build-time-only vars
  # (SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT) keep their dashboard
  # names — @sentry/vite-plugin reads them from process.env and they never
  # reach the bundle.
  export VITE_SUPABASE_URL="$SUPABASE_URL"
  export VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
  export VITE_APP_URL="${APP_URL:-}"
  export VITE_AZURE_ENDPOINT="${AZURE_VISION_ENDPOINT:-}"
  # VITE_AZURE_KEY ships to the browser — the long-term fix is to proxy OCR
  # through a Cloudflare Pages Function (functions/api/ocr.js) so the key
  # stays server-side. The app has no backend today; Tesseract.js is a
  # fallback when this key is unset or the endpoint is unavailable.
  export VITE_AZURE_KEY="${AZURE_VISION_KEY:-}"
  export VITE_SENTRY_DSN="${SENTRY_DSN:-}"
  export VITE_SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-production}"

  cd "$REACT_DIR"
  npm ci
  npm run build

  # Refuse to ship a bundle without the SPA fallback.
  for f in index.html _redirects; do
    if [[ ! -f "dist/$f" ]]; then
      echo "ERROR: dist/$f is missing after the build; refusing to deploy." >&2
      exit 1
    fi
  done
  echo "==> OK: react/dist is ready (SPA fallback: dist/_redirects)"
}

build_frontend() {
  echo "==> Build mode: legacy frontend (node $(node --version))"
  local config_file="frontend/src/config.js"

  if [[ ! -f "$config_file" ]]; then
    # Fallback for if script is run from within frontend directory
    if [[ -f "src/config.js" ]]; then
      config_file="src/config.js"
    else
      echo "Config file not found: $config_file" >&2
      exit 1
    fi
  fi

  : "${SUPABASE_URL:?SUPABASE_URL is required}"
  : "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required}"
  : "${APP_URL:=https://karting-manager.pages.dev/}"
  : "${AZURE_VISION_ENDPOINT:=}"
  : "${AZURE_VISION_KEY:=}"
  : "${SENTRY_DSN:=}"
  : "${SENTRY_ENVIRONMENT:=production}"

  # Escape a value for use as a sed replacement AND inside a JS single-quoted
  # string literal (the generated line is: export const X = 'VALUE';).
  # The outer sed replacement halves backslashes and expands &, | and the
  # delimiter, so every backslash that must survive in the file needs one extra
  # copy here. Order matters: quadruple existing backslashes first, escape & and
  # | for the outer replacement, then escape JS single quotes last (two
  # backslashes survive the outer halving as the JS escape sequence \').
  escape_sed() {
    printf '%s' "$1" | sed -e 's/\\/\\\\\\\\/g' -e 's/[&|]/\\&/g' -e "s/'/\\\\\\\\'/g"
  }

  supabase_url_escaped="$(escape_sed "$SUPABASE_URL")"
  supabase_anon_key_escaped="$(escape_sed "$SUPABASE_ANON_KEY")"
  app_url_escaped="$(escape_sed "$APP_URL")"
  azure_endpoint_escaped="$(escape_sed "$AZURE_VISION_ENDPOINT")"
  azure_key_escaped="$(escape_sed "$AZURE_VISION_KEY")"
  sentry_dsn_escaped="$(escape_sed "$SENTRY_DSN")"
  sentry_env_escaped="$(escape_sed "$SENTRY_ENVIRONMENT")"

  tmp_file="$(mktemp)"
  sed \
    -e "s|^export const APP_URL = .*|export const APP_URL = '${app_url_escaped}';|" \
    -e "s|^export const SUPABASE_URL = .*|export const SUPABASE_URL = '${supabase_url_escaped}';|" \
    -e "s|^export const SUPABASE_ANON_KEY = .*|export const SUPABASE_ANON_KEY = '${supabase_anon_key_escaped}';|" \
    -e "s|^export const AZURE_VISION_ENDPOINT = .*|export const AZURE_VISION_ENDPOINT = '${azure_endpoint_escaped}';|" \
    -e "s|^export const AZURE_VISION_KEY = .*|export const AZURE_VISION_KEY = '${azure_key_escaped}';|" \
    -e "s|^export const SENTRY_DSN = .*|export const SENTRY_DSN = '${sentry_dsn_escaped}';|" \
    -e "s|^export const SENTRY_ENVIRONMENT = .*|export const SENTRY_ENVIRONMENT = '${sentry_env_escaped}';|" \
    "$config_file" > "$tmp_file"
  mv "$tmp_file" "$config_file"

  # Production build: minify and bundle (for Cloudflare Pages etc.)
  if command -v npm >/dev/null 2>&1; then
    if [ -f package.json ]; then
      npm run build
    elif [ -f frontend/package.json ]; then
      cd frontend && npm run build && cd ..
    fi
  fi
  echo "==> OK: frontend build complete (legacy mode)"
}

if [[ "$PWD" == "$FRONTEND_DIR" ]]; then
  build_frontend
else
  build_react
fi
