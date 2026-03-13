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
  - Physical DELETE and in-place UPDATE are allowed; no audit trail.
- **Target**:
  - Only authenticated admins can edit (already true).
  - No physical deletes: add `deleted_at TIMESTAMPTZ`; "delete" = set `deleted_at = now()`.
  - "Edit" = set original row’s `deleted_at = now()`, INSERT a new row with the new data; penalties re-attached to the new row (new `race_result_id`).
  - List "current" results: filter `deleted_at IS NULL` (and optionally enforce one active result per (race_id, driver_id) if needed).
- **Steps**:
  1. **DB migration (manual)**: Add `deleted_at TIMESTAMPTZ DEFAULT NULL` to `race_results`. Add RLS policy or application logic so that physical DELETE is not used (or remove DELETE policy and use only UPDATE to set `deleted_at`). Optional: trigger or app logic to prevent physical DELETE.
  2. **API / frontend**:
     - `listRaceResults`: add `.is('deleted_at', null)` (or equivalent) so only current results are returned.
     - `updateRaceResult(id, updates)`: replace with "replace" flow: (a) update row `id` set `deleted_at = now()`, (b) insert new row with same race_id/driver_id and new data, (c) create penalties for the new row; optionally copy or leave old penalties on old row for audit.
     - `deleteRaceResult(id)`: change to soft-delete: update `race_results` set `deleted_at = now()` where id = id.
  3. **Penalties**: When "editing" a result, delete or leave old penalties (old `race_result_id`); create new penalties linked to the new race_result id. Frontend already deletes and re-creates penalties on save; backend will return the new id from the insert.

## 3. Button double-trigger and loading UX

- **Current state**: Some forms disable the submit button (e.g. Login, RaceManagement, CupManagement, SeasonManagement, DriverManagement, AdminDashboard). Table row actions (e.g. Edit/Delete in RaceDetail), modal Save (RaceResultModal, OcrImportModal), and other buttons do not consistently disable or show a global loading state.
- **Target**: All actions that trigger an async request show a global loading overlay (backdrop + spinner) and `cursor: wait`, and cannot be triggered again until the request finishes.
- **Approach**:
  1. Add a small helper (e.g. `withGlobalLoading(fn)` or `showLoadingOverlay()` / `hideLoadingOverlay()`) that:
     - Shows a full-page (or app-area) backdrop with a spinner and sets `cursor: wait` on body (or #app).
     - Wraps an async function and ensures the overlay is hidden in `finally`.
  2. Use it for: RaceDetail (add result, import OCR, edit, delete), RaceResultModal save, OcrImportModal save, and any other button-triggered API call that doesn’t already use it. Form submits that already disable the button can also use the overlay for consistency.
  3. Ensure only one overlay is active at a time (e.g. refcount or single global element).

## 4. Implementation order

1. **Loading overlay and double-submit prevention** – shared helper + wire into RaceDetail, modals, and other actions.
2. **Production build (minify)** – add Vite (or equivalent), update `build.sh`, document Cloudflare Pages settings.
3. **Race results soft-delete and replace** – document SQL migration; implement API/frontend for soft-delete and "update = soft-delete + insert"; update list to filter `deleted_at IS NULL`.
