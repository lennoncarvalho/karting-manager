#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="frontend/src/config.js"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required}"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[&|]/\\&/g'
}

supabase_url_escaped="$(escape_sed "$SUPABASE_URL")"
supabase_anon_key_escaped="$(escape_sed "$SUPABASE_ANON_KEY")"

tmp_file="$(mktemp)"
sed \
  -e "s|^export const SUPABASE_URL = .*|export const SUPABASE_URL = '${supabase_url_escaped}';|" \
  -e "s|^export const SUPABASE_ANON_KEY = .*|export const SUPABASE_ANON_KEY = '${supabase_anon_key_escaped}';|" \
  "$CONFIG_FILE" > "$tmp_file"
mv "$tmp_file" "$CONFIG_FILE"
