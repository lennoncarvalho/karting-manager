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

## Phase 3: Race results audit log

- [x] **T012** Create `race_results_log` table in Supabase (manually): mirrors `race_results` columns plus `changed_by_user_id` UUID. Document example DDL in spec folder.
- [x] **T013** Add `saveRaceResultLog` helper in `api.js`: fetches the authenticated user UUID, strips relational fields, and inserts the previous row state into `race_results_log`.
- [x] **T014** Update `updateRaceResult(id, updates)`: fetch current row, save to audit log via `saveRaceResultLog`, then apply update in-place (row ID preserved; penalty foreign keys stay valid).
- [x] **T015** Update `deleteRaceResult(id)`: fetch current row, save to audit log via `saveRaceResultLog`, then physically delete the row.
- [x] **T016** Remove `deleted_at` filters from `listRaceResults` and `listRaceResultsByRaceIds` (no soft-delete filtering needed).
