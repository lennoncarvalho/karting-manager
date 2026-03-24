# Plan: Production Hardening (009)

## 1. Minify / production build

- **Current state**: `build.sh` (run from `frontend/`) only injects env into `src/config.js`. No bundling or minification; app is served as static files (e.g. `frontend/` or `frontend/dist/`).
- **Target**: After config injection, run a production build that bundles and minifies JS (and CSS) into a single output dir (e.g. `frontend/dist/`) so Cloudflare Pages can use it as the publish directory.
- **Approach**:
  - Add a bundler in `frontend/` (e.g. Vite) with `index.html` as entry; bundle all ES modules and assets.
  - In `build.sh`, after the existing `sed` config injection, run `npm run build` when `npm` and `package.json` exist (so CI/Cloudflare can run one command).
  - Cloudflare Pages: build command = `./build.sh` (with working directory = `frontend`), publish directory = `dist`. Env vars (SUPABASE_URL, etc.) set in Cloudflare dashboard.
- **Files**: `frontend/package.json`, `frontend/vite.config.js`, `frontend/build.sh` (or keep `build.sh` at repo root and pass path to config; current spec assumes build.sh in frontend or called from frontend).

## 2. Race results: tampering prevention and audit trail

- **Current state**:
  - RLS: only admins can INSERT/UPDATE/DELETE `race_results`; public can SELECT. Good.
  - Mutations use `getAuthenticatedClient()` so only logged-in users; RLS enforces admin.
  - Updates are in-place and deletes are physical; an audit log table records the previous state before any mutation.
- **Target**:
  - Only authenticated admins can edit (already true).
  - Before any update or delete, the previous row state is saved to `race_results_log` (mirrors `race_results` columns + `changed_by_user_id` UUID).
  - Updates are applied in-place (row ID preserved, so penalty foreign keys stay valid).
  - Deletes are physical (row removed from `race_results`).
  - The `race_results` table keeps `created_at` and `updated_at` columns for traceability.
- **Steps**:
  1. **DB table (manual)**: Create `race_results_log` table mirroring `race_results` columns plus a `changed_by_user_id` UUID column. No foreign key constraints needed on the log table.
  2. **API / frontend**:
     - `listRaceResults` / `listRaceResultsByRaceIds`: straightforward SELECT on `race_results` (no filtering needed).
     - `updateRaceResult(id, updates)`: fetch current row, save it to `race_results_log` with the authenticated user UUID, then apply the update in-place.
     - `deleteRaceResult(id)`: fetch current row, save it to `race_results_log` with the authenticated user UUID, then physically delete the row.
  3. **Penalties**: Since updates are in-place and the row ID is preserved, penalty foreign keys (`race_result_id`) remain valid without re-association.

## 3. Button double-trigger and loading UX

- **Current state**: Some forms disable the submit button (e.g. Login, RaceManagement, CupManagement, SeasonManagement, DriverManagement, AdminDashboard). Table row actions (e.g. Edit/Delete in RaceDetail), modal Save (RaceResultModal, OcrImportModal), and other buttons do not consistently disable or show a global loading state.
- **Target**: All actions that trigger an async request show a global loading overlay (backdrop + spinner) and `cursor: wait`, and cannot be triggered again until the request finishes.
- **Approach**:
  1. Add a small helper (e.g. `withGlobalLoading(fn)` or `showLoadingOverlay()` / `hideLoadingOverlay()`) that:
     - Shows a full-page (or app-area) backdrop with a spinner and sets `cursor: wait` on body (or #app).
     - Wraps an async function and ensures the overlay is hidden in `finally`.
  2. Use it for: RaceDetail (add result, import OCR, edit, delete), RaceResultModal save, OcrImportModal save, and any other button-triggered API call that doesn't already use it. Form submits that already disable the button can also use the overlay for consistency.
  3. Ensure only one overlay is active at a time (e.g. refcount or single global element).

## 4. Implementation order

1. **Loading overlay and double-submit prevention** - shared helper + wire into RaceDetail, modals, and other actions.
2. **Production build (minify)** - add Vite (or equivalent), update `build.sh`, document Cloudflare Pages settings.
3. **Race results audit log** - create `race_results_log` table; implement `saveRaceResultLog` helper; update `updateRaceResult` and `deleteRaceResult` to log previous state before mutation.
