# 009 Production Hardening

## Cloudflare Pages

- **Root directory**: `frontend`
- **Build command**: `../build.sh`
- **Build output directory**: `dist`
- **Environment variables**: Set in Cloudflare dashboard: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `AZURE_VISION_ENDPOINT`, `AZURE_VISION_KEY`.

The build script injects config into `src/config.js` and runs `npm run build` (Vite) to produce minified assets in `dist/`.

## Race results soft-delete (database)

Before deploying the app changes that use soft-delete for race_results:

1. Run the SQL in **migration-race-results-soft-delete.sql** in the Supabase SQL Editor.
2. This adds `deleted_at` to `race_results`. List queries filter `deleted_at IS NULL`; edits create a new row and mark the original as deleted; deletes set `deleted_at` instead of removing the row.

If the migration has not been run, list/update/delete for race_results may fail (e.g. column not found).
