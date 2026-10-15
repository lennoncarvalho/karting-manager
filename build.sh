#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Pages build script (project: kartarados).
#
# Bridges Cloudflare dashboard env var names to VITE_ prefixed names
# (Vite only injects VITE_-prefixed vars into the bundle at build time).

echo "==> Build (node $(node --version))"

# Fail fast on missing required build-time env vars.
missing=()
[[ -n "${SUPABASE_URL:-}" ]] || missing+=("SUPABASE_URL")
[[ -n "${SUPABASE_ANON_KEY:-}" ]] || missing+=("SUPABASE_ANON_KEY")
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "ERROR: missing required build-time env var(s): ${missing[*]}" >&2
  echo "Set them in Cloudflare Pages > kartarados > Settings > Environment variables." >&2
  exit 1
fi

# Bridge Cloudflare dashboard names -> Vite names. Build-time-only vars
# (SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT) keep their dashboard
# names — @sentry/vite-plugin reads them from process.env and they never
# reach the bundle.
export VITE_SUPABASE_URL="$SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
export VITE_APP_URL="${APP_URL:-}"
export VITE_AZURE_ENDPOINT="${AZURE_VISION_ENDPOINT:-}"
# VITE_AZURE_KEY ships to the browser — the long-term fix is to proxy OCR
# through a Cloudflare Pages Function (functions/api/ocr.js) so the key
# stays server-side. The app has no backend today; Tesseract.js is the
# fallback when this key is unset or the endpoint is unavailable.
export VITE_AZURE_KEY="${AZURE_VISION_KEY:-}"
export VITE_SENTRY_DSN="${SENTRY_DSN:-}"
export VITE_SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-production}"

npm ci
npm run build

# Refuse to ship a bundle without the SPA fallback.
for f in dist/index.html dist/_redirects; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: $f is missing after the build; refusing to deploy." >&2
    exit 1
  fi
done
echo "==> OK: dist is ready (SPA fallback: dist/_redirects)"