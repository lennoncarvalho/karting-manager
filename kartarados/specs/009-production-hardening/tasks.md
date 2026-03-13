# Tasks: Production Hardening (009)

## Phase 1: Loading overlay and double-submit prevention

- [x] **T001** Add `withGlobalLoading(asyncFn)` (or show/hide overlay helpers) in `frontend/src/utils/helpers.js`: full-page backdrop, spinner, `cursor: wait`; ensure hide in `finally`; single overlay instance.
- [x] **T002** Add i18n key(s) for loading message if shown in overlay (e.g. "Loading...").
- [x] **T003** Wrap RaceDetail async actions (add result click, import OCR click, table edit/delete) with global loading.
- [x] **T004** Wrap RaceResultModal save handler with global loading (or ensure modal save is called from a context that already uses loading).
- [x] **T005** Wrap OcrImportModal save handler with global loading.
- [x] **T006** Optionally wrap other submit/click handlers (Login, AdminDashboard, SeasonManagement, CupManagement, RaceManagement, DriverManagement) with global loading for consistency, or rely on existing button disable + overlay for uniformity.

## Phase 2: Production build (minify)

- [x] **T007** Add `frontend/package.json` with Vite and build script (`vite build`).
- [x] **T008** Add `frontend/vite.config.js`: entry `index.html`, outDir `dist`, minify enabled.
- [x] **T009** Update `build.sh`: after config injection, run `npm run build` when in a directory that has `package.json` (or run from frontend: `npm run build`). Ensure build.sh is intended to run from `frontend/` (current CONFIG_FILE path).
- [x] **T010** Document Cloudflare Pages: build command and publish directory (e.g. `./build.sh`, `dist`); env vars in dashboard.
- [x] **T011** Add `frontend/.gitignore` entry for `dist/` and `node_modules/` if not already present.

## Phase 3: Race results audit trail and soft-delete

- [x] **T012** Provide SQL migration in spec folder: add `deleted_at TIMESTAMPTZ DEFAULT NULL` to `race_results`; optional index on `(race_id, driver_id, deleted_at)` for "current" listing.
- [x] **T013** Update `listRaceResults` and `listRaceResultsByRaceIds` to filter `deleted_at IS NULL`.
- [x] **T014** Replace `updateRaceResult(id, updates)` with "replace" flow: soft-delete row `id` (set `deleted_at = now()`), insert new row with same race_id/driver_id and new data, return new row; frontend creates penalties for new row and does not delete penalties from old row (or backend handles penalty reassociation if desired).
- [x] **T015** Replace `deleteRaceResult(id)` with soft-delete: update `race_results` set `deleted_at = now()` where id = id.
- [x] **T016** Update RaceDetail (and any caller) to use new API behavior: on "edit" save, receive new result id and refresh list; penalties tied to new result id.
- [ ] **T017** Consider unique constraint: (race_id, driver_id) for rows where deleted_at IS NULL (partial unique index in Postgres) so only one "current" result per driver per race.
