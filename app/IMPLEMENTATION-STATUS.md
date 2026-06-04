# Kartarados v2 — Implementation Status

Snapshot taken at scaffold time. The new Angular 19 project under `app/`
covers the foundation, all core services, all shared `kt-*` components,
and a working version of every feature page. A few high-volume v1
behaviours (full OCR wizard, full RaceResult editor with penalty rows)
are stubbed and clearly marked TODO. The list below is the parity
checklist; tick items off as they get ported.

Legend: ✅ done · 🟡 partial / scaffolded · ⚪ not started

---

## Foundation
| Item | Status | Notes |
|---|---|---|
| `package.json` (Angular 19 + ng-bootstrap + Supabase + Sentry) | ✅ | Run `npm install` to materialise it |
| `angular.json` (esbuild, i18n pt-BR/en, SCSS, prefix `kt`) | ✅ | |
| `tsconfig.json` + `tsconfig.app.json` (strict + strictTemplates) | ✅ | |
| `src/index.html`, `main.ts`, `app.config.ts`, `app.routes.ts` | ✅ | Zoneless, signals, `withComponentInputBinding` |
| `src/styles.scss` (bootstrap + 3 themed rules + flag-icons) | ✅ | |
| `src/_redirects` (Cloudflare SPA fallback) | ✅ | |
| `.env.example` + environments | ✅ | Replace placeholder Supabase keys before running |
| Assets copied (`kart_favicon.svg`, `kartarados_3grays.png`) | ✅ | |
| Locale XLIFF files | ✅ | `messages.{en,pt-BR}.xlf` populated by `npm run i18n:sync` (runs `ng extract-i18n` then `scripts/migrate-json-to-xlf.mjs` which back-fills `<target>` tags from `frontend/src/translations/{en,pt-BR}.json` by `<source>` text). Last sync: 234 trans-units extracted, 43 mapped to pt-BR, 31 ngb.* skipped (ng-bootstrap ships its own bundles), 104 strings present in templates but absent from v1 JSON remain untranslated (`i18nMissingTranslation: warning` surfaces them). |

## Core layer (`src/app/core/`)
| Service | Status | Notes |
|---|---|---|
| `models.ts` — full typed schema | ✅ | Season, Cup, Driver, Race, RaceResult, Penalty, RaceResultLog + STANDARD_PENALTY_POINTS |
| `supabase.service.ts` | ✅ | Singleton client + error-message humanizer |
| `auth.store.ts` | ✅ | Session signal, `isAdmin`, login/logout/changePassword/resetPasswordForEmail |
| `auth.guard.ts` | ✅ | Functional guard with returnUrl |
| `season.store.ts` | ✅ | Cached seasons, selected-season signal, accent-theme effect, upsert/removeLocal helpers |
| `theme.service.ts` | ✅ | Mirrors v1 `theme.js` (`--kt-season-accent` CSS var) |
| `loading.service.ts` | ✅ | Global in-flight counter signal |
| `error.handler.ts` | ✅ | `ErrorHandler` provider → Sentry capture |
| `storage.util.ts` | ✅ | Safe localStorage JSON helpers |
| `api.service.ts` | ✅ | Full CRUD for seasons/cups/drivers/races/raceResults/penalties + `race_results_log` audit logging on update/delete |
| `ocr.service.ts` | ✅ | Azure Document Intelligence + Tesseract.js `por` fallback |
| `points.ts` | ✅ | Ported verbatim from v1, **pole/fastest-lap +1 bonus preserved** (see header comment) |
| `points.spec.ts` (vitest) | ✅ | Critical-path tests for pole/FL bonus + penalty subtraction + lap-time parsing |

## Shared layer (`src/app/shared/`)
| Component / pipe / directive | Status | Notes |
|---|---|---|
| `kt-button` | ✅ | Variants, sizes, `loading`, `accent`, icon |
| `kt-driver-image` | ✅ | Avatar with initials fallback, multiple sizes |
| `kt-season-select` | ✅ | Reads/writes `SeasonStore` |
| `kt-loading-overlay` | ✅ | Bound to `LoadingService.isLoading` |
| `kt-empty-state` | ✅ | Icon + title + optional message |
| `kt-form-error` | ✅ | Bootstrap danger alert |
| `kt-flag` | ✅ | Uses flag-icons; maps locale → flag code |
| `kt-confirm-dialog` + `ConfirmDialogService` | ✅ | ng-bootstrap NgbModal-based |
| `kt-driver-image-uploader` | ✅ | File input + Supabase Storage upload + `[(value)]` URL model + DriverImage fallback preview. Vitest sanity test under same folder. |
| `kt-skeleton-row` | ✅ | `tbody[kt-skeleton-row]` attribute component; `placeholder-glow` rows with varied widths. Tables-only per resume plan Open-3. |
| `kt-race-result-modal` + `RaceResultModalService` | ✅ | Full port of v1 `RaceResultModal.js`. NgbModal-based, signal-driven template, standard + custom penalty rows, duplicate-driver guard, lap-time/positive-int validation. Resolves with a `RaceResultModalPayload` the caller persists. |
| `validators.ts` | ✅ | Pure `isRequired` / `isPositiveInteger` / `isValidLapTime` (port of v1 `utils/validation.js`). Used by the race-result modal. |
| `pipes/lap-time.pipe.ts` | ✅ | |
| `pipes/date-time.pipe.ts` | ✅ | `dd/MM/yyyy HH:mm` lightweight formatter |
| `directives/accent-header.directive.ts` (`[ktAccentHeader]`) | ❌ removed | Accent applied globally via `:where(.table thead th, .navbar, .btn-primary, .card-header, .modal-header, .nav-tabs .nav-link.active, …)` in `styles.scss`. All template usages stripped. |
| `directives/async-click.directive.ts` (`[ktAsyncClick]`) | ✅ | |

## Layout (`src/app/layout/`)
| Component | Status |
|---|---|
| `navigation/` | ✅ — dark `navbar-expand-lg`, `kartarados_3grays.png` brand at 80 px, `[ngbCollapse]` mobile toggle, admin route links, `<kt-season-select>`, `NgbDropdown` user-email menu with Logout (anonymous: Login link). |
| `footer/` | ✅ — themed via `var(--kt-season-accent)`; left: LinkedIn credit + MIT License + © year; right: GitHub icon + locale flag buttons (hard-navigate to swap bundles). |

## Features (`src/app/features/`)
| Feature | Status | Notes / TODO |
|---|---|---|
| `public-rankings/` | ✅ | Rebuilt with `ngbNav` tabs: **Calendar** (chronological race list with winner + fastest lap, race-name link visible to admins), **Overall**, one tab **per cup** (sorted by `cups.start_date` asc), **Penalties** (last). Ongoing-only season selector. Uses the ported `points.ts` engine; `<tbody kt-skeleton-row>` while loading. The v1 page had additional polish — "compact mode" toggle, sortable columns, season-summary cards — not in spec §6; port them on demand. |
| `login/` | ✅ | Email/password + returnUrl, themed card header, and a **"Forgot password?" link** that resolves to the live `/auth/reset-password` route (Step 7 done). |
| `admin-dashboard/` | ✅ | Tile grid linking to admin pages, plus a dedicated **OCR import** card explaining that OCR is launched from the race-detail screen (until the OCR feature module lands). |
| `seasons/` | ✅ | Re-skinned to v1 two-card layout (form-left / list-right). Always-visible form, themed `card-header`, `busy()` on Save, `loadingList()` skeleton rows via `<tbody kt-skeleton-row>`. |
| `cups/` | ✅ | Same v1 two-card layout, gated by selected season; skeleton rows on first load. |
| `drivers/` | ✅ | Re-skinned to v1 two-card layout with the **`<kt-driver-image-uploader>` wired into the form** (replaces the old picture-URL text input). Skeleton rows on first load. |
| `races/` | ✅ | Same v1 two-card layout; cup picker + `affects_championship` flag; skeleton rows on first load. |
| `race-detail/` | ✅ | Lists results with driver/penalty info. **Add / Edit / Delete** all wired through `RaceResultModalService` (full v1 `RaceResultModal.js` port). Delete uses `kt-confirm-dialog`; edits re-persist penalties wholesale (delete-by-result + bulk insert) to match v1 semantics; the API service still pushes the prior row to `race_results_log` on update/delete. Also exposes an **Import via OCR** button that deep-links to `/admin/ocr-import?raceId=…`. |
| `ocr-import/` | ✅ | Full flow: upload image → `OcrService.run` (Azure → Tesseract fallback) → `detectSheetType` confirmation → `parseOcrRows` → `matchDriverName` auto-match → operator-reviewable table with per-row driver picker & skip → persist via `ApiService.createRaceResult` (race mode) or `updateRaceResult` (qualifying mode, sets `grid_start_position` + `best_lap_time`). Drafts persist to `localStorage` under v1's `ocrImportDraft:<raceId>` key. Mode gating (race blocked when results exist, qualifying blocked when none) + duplicate-driver guard match v1. Pure parser/matcher utilities live in `core/ocr-parsing.ts` + `core/ocr-matching.ts` with vitest specs (11 tests). **Intentionally NOT ported:** v1's canvas crop/enhance/threshold tooling — purely additive UI work if needed later. |

## Routing (`src/app/app.routes.ts`)
| Route | Status |
|---|---|
| `/` → public rankings | ✅ |
| `/login` | ✅ |
| `/admin` (guarded) → dashboard | ✅ |
| `/admin/seasons`, `/cups`, `/drivers`, `/races`, `/races/:raceId` | ✅ |
| `/races/:raceId` (public race detail) | ✅ |
| `/admin/ocr-import` | ✅ | Guarded under `/admin`. Reads `raceId` from query params. |
| `/auth/reset-password` | ✅ | Lazy-loaded `ResetPasswordComponent`; uses `AuthStore.changePassword` (wraps `supabase.auth.updateUser({ password })`) once Supabase's `PASSWORD_RECOVERY` event has set the temporary session. Two-field form (new password + confirm), 8-char minimum, redirects to `/admin` on success. Login page's "Forgot password?" link now resolves. |
| `**` → redirect `/` | ✅ |

## Known divergences from v1 that I intentionally **kept** (per your earlier answers)
- **Pole position and fastest lap still award +1 bonus** (code wins; documented in `points.ts` header and spec §6.7).
- **Suspension flag** is calculated when `raceDirectionPenaltyPoints ≤ -20` but **not surfaced** in any UI (matches v1).
- **Driver weight** is collected/displayed but **never used** in points math.
- **Race results are editable forever** by any admin (no time window) — but every update/delete writes the previous row to `race_results_log`.

## Improvements added beyond strict v1 parity
- **Route-level prefetch** at app boot: `app.config.ts` invokes `AuthStore.restoreSession()` + `SeasonStore.bootstrap()` via `provideAppInitializer`, so the first paint already has the seasons list and the active season's accent color.
- **Stricter typing**: every Supabase row is a typed `interface` (`core/models.ts`) instead of vanilla object property access.
- **Single API surface**: all 6 CRUD groups live in `ApiService` for easy mocking in tests.
- **Audit log helper**: `ApiService.logRaceResultBeforeChange` is private and called transparently on `updateRaceResult` / `deleteRaceResult`, so feature code can't forget it.

## Suggestions — resolutions
1. **Driver picture upload** — ✅ Built `<kt-driver-image-uploader>` (Step 3) **and wired into the drivers form** (Step 4).
2. **Server-side audit trigger** — ⏸ Skipped for later. Current JS-side audit-log stays.
3. **`profiles` table with `role` column** — ⏸ Skipped for later. Any authenticated user remains admin.
4. **Per-season toggle for pole/FL bonus** — ❌ Closed. Pole/FL +1 bonus is the canonical rule; no toggle. Spec 010 §6.7 updated, §12 reconciliation row dropped, §14 open question dropped, `points.ts` header reworded.
5. **Generated DB types** — 📄 Captured in dedicated spec `kartarados/specs/011-generated-db-types/spec.md` (Status: Planned — deferred).
6. **Skeleton loaders** — ✅ `<kt-skeleton-row>` built (Step 3) **and adopted by all five admin tables** (Step 4): drivers, seasons, cups, races. (Race-detail still pending — part of Step 5.)

## Open Decisions (resolved)
1. UI library — ng-bootstrap + Bootstrap utilities (always prefer).
2. OCR layout — split into feature module with single-responsibility files.
3. Skeleton scope — tables only.
4. Accent helpers — fully remove `.kt-*` accent classes and `[ktAccentHeader]`.
5. DB-types plan — own numbered spec (011).
6. Password reset — in-app via `supabase.auth.updateUser({ password })` at `/auth/reset-password`.
7. Spec edit scope — broader cleanup pass of spec 010 (✅ done).
