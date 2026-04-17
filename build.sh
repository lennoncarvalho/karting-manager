#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="frontend/src/config.js"

if [[ ! -f "$CONFIG_FILE" ]]; then
  # Fallback for if script is run from within frontend directory
  if [[ -f "src/config.js" ]]; then
    CONFIG_FILE="src/config.js"
  else
    echo "Config file not found: $CONFIG_FILE" >&2
    exit 1
  fi
fi

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required}"
: "${APP_URL:=https://karting-manager.pages.dev/}"
: "${AZURE_VISION_ENDPOINT:=}"
: "${AZURE_VISION_KEY:=}"
: "${SENTRY_DSN:=}"
: "${SENTRY_AUTH_TOKEN:=}"
: "${SENTRY_ENVIRONMENT:=production}"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[&|]/\\&/g'
}

supabase_url_escaped="$(escape_sed "$SUPABASE_URL")"
supabase_anon_key_escaped="$(escape_sed "$SUPABASE_ANON_KEY")"
app_url_escaped="$(escape_sed "$APP_URL")"
azure_endpoint_escaped="$(escape_sed "$AZURE_VISION_ENDPOINT")"
azure_key_escaped="$(escape_sed "$AZURE_VISION_KEY")"
sentry_dsn_escaped="$(escape_sed "$SENTRY_DSN")"
sentry_env_escaped="$(escape_sed "$SENTRY_ENVIRONMENT")"
sentry_auth_token="$(escape_sed "$SENTRY_AUTH_TOKEN")"

tmp_file="$(mktemp)"
sed \
  -e "s|^export const APP_URL = .*|export const APP_URL = '${app_url_escaped}';|" \
  -e "s|^export const SUPABASE_URL = .*|export const SUPABASE_URL = '${supabase_url_escaped}';|" \
  -e "s|^export const SUPABASE_ANON_KEY = .*|export const SUPABASE_ANON_KEY = '${supabase_anon_key_escaped}';|" \
  -e "s|^export const AZURE_VISION_ENDPOINT = .*|export const AZURE_VISION_ENDPOINT = '${azure_endpoint_escaped}';|" \
  -e "s|^export const AZURE_VISION_KEY = .*|export const AZURE_VISION_KEY = '${azure_key_escaped}';|" \
  -e "s|^export const SENTRY_DSN = .*|export const SENTRY_DSN = '${sentry_dsn_escaped}';|" \
  -e "s|^export const SENTRY_ENVIRONMENT = .*|export const SENTRY_ENVIRONMENT = '${sentry_env_escaped}';|" \
  -e "s|^export const SENTRY_AUTH_TOKEN = .*|export const SENTRY_AUTH_TOKEN = '${sentry_auth_token}';|" \
  "$CONFIG_FILE" > "$tmp_file"
mv "$tmp_file" "$CONFIG_FILE"

# Production build: minify and bundle (for Cloudflare Pages etc.)
if command -v npm >/dev/null 2>&1; then
  if [ -f package.json ]; then
    npm run build
  elif [ -f frontend/package.json ]; then
    cd frontend && npm run build && cd ..
  fi
fi
