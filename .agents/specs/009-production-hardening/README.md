# 009 Production Hardening

## Cloudflare Pages

- **Root directory**: `frontend`
- **Build command**: `../build.sh`
- **Build output directory**: `dist`
- **Environment variables**: Set in Cloudflare dashboard: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `AZURE_VISION_ENDPOINT`, `AZURE_VISION_KEY`.

The build script injects config into `src/config.js` and runs `npm run build` (Vite) to produce minified assets in `dist/`.

## Race results audit log (database)

Race results use an audit log approach for tamper prevention:

1. Create a `race_results_log` table that mirrors all `race_results` columns plus a `changed_by_user_id` UUID column to record who made the change.
2. Before any update or delete on `race_results`, the app saves the previous row state to `race_results_log` with the authenticated user's UUID.
3. Updates are applied in-place (row ID preserved); deletes are physical. The `race_results` table keeps `created_at` and `updated_at` columns for traceability.

No migration is needed on the `race_results` table itself. The `race_results_log` table is created manually in Supabase.
