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
| Locale stub XLIFF files | 🟡 | `messages.*.xlf` are empty stubs; run `npm run i18n:extract` then populate `<target>` tags from `frontend/src/translations/*.json` |

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
| `pipes/lap-time.pipe.ts` | ✅ | |
| `pipes/date-time.pipe.ts` | ✅ | `dd/MM/yyyy HH:mm` lightweight formatter |
| `directives/accent-header.directive.ts` (`[ktAccentHeader]`) | ✅ | |
| `directives/async-click.directive.ts` (`[ktAsyncClick]`) | ✅ | |

## Layout (`src/app/layout/`)
| Component | Status |
|---|---|
| `navigation/` | ✅ — brand, route links, season selector, login/logout |
| `footer/` | ✅ — copyright + locale flags (hard-navigate to swap bundles) |

## Features (`src/app/features/`)
| Feature | Status | Notes / TODO |
|---|---|---|
| `public-rankings/` | ✅ | Three modes (overall / cup / penalty), uses the ported points engine, season-aware via `SeasonStore`. **Note:** the v1 page had additional polish — "compact mode" toggle, sortable columns, season-summary cards. These are not in the new spec §6 explicitly; port them on demand. |
| `login/` | ✅ | Email/password + returnUrl, password reset still callable via `AuthStore.requestPasswordReset` but no UI yet. |
| `admin-dashboard/` | ✅ | Tile grid linking to admin pages. v1 also exposed "OCR import" as an action — add a link once `ocr-import` is wired into a real flow. |
| `seasons/` | ✅ | Full CRUD with inline editor, accent color picker, ongoing flag, confirm-dialog on delete. |
| `cups/` | ✅ | Full CRUD scoped to the selected season. |
| `drivers/` | ✅ | Full CRUD with inline editor + avatar preview. **TODO:** picture upload to the Supabase `driver-pictures` bucket (the v1 page uses a file input + storage upload). Currently the form accepts only an existing URL. |
| `races/` | ✅ | Full CRUD with cup picker + `affects_championship` flag. |
| `race-detail/` | 🟡 | Lists results with driver/penalty info. **TODO:** port the v1 `RaceResultModal.js` (251 lines) into a `kt-race-result-modal` shared modal so admins can add/edit results + their penalties from this page. Current "Add result" button is a placeholder. |
| `ocr-import/` | 🟡 | Foundation only — calls `OcrService` and shows raw extracted text + provider name. **TODO:** port the full multi-step wizard from `frontend/src/components/OcrImportModal.js` (648 lines): driver-matching heuristics (`utils/matching.js`), table parsing (`utils/parsing.js`), preview/edit grid, persist results via `ApiService.createRaceResult` + `createPenalties`. |

## Routing (`src/app/app.routes.ts`)
| Route | Status |
|---|---|
| `/` → public rankings | ✅ |
| `/login` | ✅ |
| `/admin` (guarded) → dashboard | ✅ |
| `/admin/seasons`, `/cups`, `/drivers`, `/races`, `/races/:raceId` | ✅ |
| `/races/:raceId` (public race detail) | ✅ |
| `**` → redirect `/` | ✅ |
| `/admin/ocr-import` | ⚪ | Add when OCR feature lands |
| Password reset deep-link route | ⚪ | Wire when adding the reset UI |

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

## Suggestions worth discussing
1. **Driver picture upload** — move to a shared `kt-driver-image-uploader` component that talks to `supabase.storage.from('driver-pictures').upload(...)`. (Currently only the URL field exists.)
2. **Server-side audit trigger** — the new spec §14 already notes this. Putting the audit insert inside a Postgres trigger would let us drop the JS-side read-then-log dance in `ApiService`.
3. **`profiles` table with a `role` column** — currently `isAdmin` is "any authenticated user". For multi-admin clubs with read-only collaborators, a real role check would be safer.
4. **Per-season toggle for pole/FL bonus** — would resolve the "code vs spec 002" tension cleanly. Cheap to add (one extra column + a branch in `points.ts`).
5. **Generated DB types** — wire `supabase gen types typescript` into a `prebuild` script so `core/models.ts` becomes a hand-written facade over a generated source-of-truth file.
6. **Skeleton loaders** — the global `kt-loading-overlay` works but a per-table skeleton would feel snappier on slow connections (a quick win once we add a `kt-skeleton-row` shared component).

If any of the 🟡 / ⚪ items above are blockers for your first deploy, point me at the most important one and I'll port it next.
