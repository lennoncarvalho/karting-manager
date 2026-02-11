#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="src/config.js"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required}"
: "${AZURE_VISION_ENDPOINT:=}"
: "${AZURE_VISION_KEY:=}"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[&|]/\\&/g'
}

supabase_url_escaped="$(escape_sed "$SUPABASE_URL")"
supabase_anon_key_escaped="$(escape_sed "$SUPABASE_ANON_KEY")"
azure_endpoint_escaped="$(escape_sed "$AZURE_VISION_ENDPOINT")"
azure_key_escaped="$(escape_sed "$AZURE_VISION_KEY")"

tmp_file="$(mktemp)"
sed \
  -e "s|^export const SUPABASE_URL = .*|export const SUPABASE_URL = '${supabase_url_escaped}';|" \
  -e "s|^export const SUPABASE_ANON_KEY = .*|export const SUPABASE_ANON_KEY = '${supabase_anon_key_escaped}';|" \
  -e "s|^export const AZURE_VISION_ENDPOINT = .*|export const AZURE_VISION_ENDPOINT = '${azure_endpoint_escaped}';|" \
  -e "s|^export const AZURE_VISION_KEY = .*|export const AZURE_VISION_KEY = '${azure_key_escaped}';|" \
  "$CONFIG_FILE" > "$tmp_file"
mv "$tmp_file" "$CONFIG_FILE"
