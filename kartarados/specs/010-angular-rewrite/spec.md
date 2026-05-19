# Feature Specification: Kartarados v2 — Angular Rewrite (Unified Spec)

**Feature Branch**: `010-angular-rewrite`
**Created**: 2026-05-19
**Status**: Draft
**Supersedes**: specs 001–009
**Input**: Rewrite the existing vanilla-JS Kartarados karting championship manager as a brand-new Angular app, preserving the live Supabase database and the production business rules. The current vanilla-JS codebase is the **source of truth** wherever it diverges from earlier specs.

> Read the skills under `kartarados/skills/` (angular, bootstrap, supabase) before working on this spec.

---

## 1. Background

Kartarados is a generalist go-kart championship manager. It started as a POC and is now in production at a single club with real user engagement. v1 is vanilla JS on Vite, hosted on Cloudflare Pages, backed by Supabase (Auth + Postgres + Storage). v2 replaces the frontend with **Angular 19+** while keeping the Supabase database, business rules, and hosting model intact.

The app is **single-tenant** (one club per deployment) but generalist enough to be reused by any karting club worldwide.

### Why a rewrite

- The vanilla-JS code is hard to evolve — pages mix HTML, templating, DOM logic, and API calls.
- Need first-class component reuse (driver image, buttons, modals, season selector, …).
- Want type safety, signals, structured i18n, and a maintainable architecture.

### What stays

- Supabase project and schema (with minor additions documented below).
- Cloudflare Pages hosting + GitHub integration for deploys.
- All visible business rules currently implemented in production.
- Sentry for error monitoring.

### What changes

- Frontend → Angular 19+ (standalone components, signals, zoneless, new control flow).
- UI → Bootstrap 5 utilities + `ng-bootstrap` for interactive components.
- i18n → `@angular/localize` (compile-time) for `pt-BR` and `en`.
- Build → Angular CLI (esbuild builder).

---

## 2. Goals & Non-Goals

### Goals

1. Feature-parity rewrite — every behaviour described in §6 (Functional Requirements) must work identically to v1.
2. Strong separation of concerns:
   - **One Angular component = three files** (`.ts`, `.html`, optional `.scss`). No inline templates or styles.
   - **Everything that can be a reusable component or directive must be one** (buttons, driver image, modals, season selector, loading overlay, badges, empty states).
3. Near-zero custom CSS. Use Bootstrap 5 utilities + ng-bootstrap. Custom CSS is allowed only inside a single shared component when no utility can express the visual.
4. Type safety end-to-end (`strict: true`, typed Supabase row models).
5. Performance: FCP < 1.8 s, LCP < 2.5 s on a mid-tier mobile + 3G connection (same targets as v1).
6. Deployable to Cloudflare Pages (or any equivalent static host with a build step + GitHub integration).

### Non-Goals

- Multi-tenant / multi-club support. Single club per deployment. (Future consideration only.)
- Offline / PWA. Online-only, matching v1.
- Server-side rendering. CSR SPA.
- Real-time updates (websockets/Supabase realtime). Refetch on user action is sufficient.
- Backend services other than Supabase (no Edge Functions, no separate Node API).
- New end-user features beyond what specs 001–009 collectively define and what is implemented in the current code.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Angular ≥ 19, standalone, zoneless, signals | `provideZonelessChangeDetection()` |
| Language | TypeScript strict | `strictTemplates: true` |
| Routing | Angular Router with lazy `loadChildren` | Functional guards (`CanActivateFn`) |
| State | Signals + injectable services (no NgRx) | One service per domain |
| HTTP | `provideHttpClient(withFetch())` | For Azure OCR + any non-Supabase calls |
| Backend SDK | `@supabase/supabase-js` v2 | Anon key only on client |
| UI components | `@ng-bootstrap/ng-bootstrap` | Modals, dropdowns, tabs, datepicker, toasts |
| CSS | Bootstrap 5.3+ utilities | Compiled via SCSS |
| Icons | `bootstrap-icons` (+ `flag-icons` for footer flags) | npm packages |
| OCR | Azure Document Intelligence (prebuilt-layout) + Tesseract.js `por` fallback | Same hybrid as v1 |
| Error monitoring | `@sentry/angular` | Replaces `@sentry/browser` |
| i18n | `@angular/localize` | `pt-BR` (default), `en` |
| Build | Angular CLI esbuild builder | AOT + build optimizer |
| Hosting | Cloudflare Pages (primary), provider-agnostic | Static output + SPA fallback |
| CI | GitHub Actions → Cloudflare Pages | Existing flow preserved |
| Testing | Jest or Vitest | Only critical paths (see §10) |

---

## 4. Architecture & Project Layout

```
frontend/
├── angular.json
├── package.json
├── tsconfig.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss                 ← bootstrap import + the 3 themed rules
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── locale/
│   │   ├── messages.pt-BR.xlf
│   │   └── messages.en.xlf
│   └── app/
│       ├── app.config.ts
│       ├── app.routes.ts
│       ├── app.component.{ts,html}
│       ├── core/                   ← singletons, guards, interceptors
│       │   ├── supabase.service.ts
│       │   ├── auth.store.ts
│       │   ├── auth.guard.ts
│       │   ├── theme.service.ts
│       │   ├── season.store.ts
│       │   ├── loading.service.ts
│       │   └── error.handler.ts
│       ├── shared/                 ← reusable UI primitives (kt-*)
│       │   ├── kt-button/
│       │   ├── kt-driver-image/
│       │   ├── kt-season-select/
│       │   ├── kt-confirm-dialog/
│       │   ├── kt-loading-overlay/
│       │   ├── kt-empty-state/
│       │   ├── kt-form-error/
│       │   ├── kt-flag/            ← language switch flags
│       │   └── pipes/              (lap-time.pipe, date-time.pipe)
│       ├── layout/
│       │   ├── navigation/
│       │   └── footer/
│       └── features/
│           ├── public-rankings/
│           ├── login/
│           ├── admin-dashboard/
│           ├── seasons/
│           ├── cups/
│           ├── races/
│           ├── race-detail/
│           ├── drivers/
│           └── ocr-import/
└── (vite/ng build output → dist/)
```

### Modules / Boundaries

- `core/` may be imported by anyone but imports nothing from `features/`.
- `features/` may import from `core/` and `shared/` only, never from another feature.
- `shared/` may import from `core/` only.
- All components are **standalone**; no NgModules anywhere.

### State

| Store | Owns |
|---|---|
| `AuthStore` | Current Supabase session, `isAdmin` computed signal |
| `SeasonStore` | List of seasons, selected season id, active season resolver, accent color |
| `LoadingService` | Global `inFlight` counter signal driving `kt-loading-overlay` |
| `I18nStore` | Current locale (read at boot, write triggers full page reload to the locale-specific bundle) |

Domain reads/writes (drivers, races, race results, cups, penalties) live in their feature services and do not maintain global state — they return promises/signals scoped to the calling page. Caching for `seasons` is implemented in `SeasonStore` using `localStorage` (see §7.4).

---

## 5. Data Model

The v2 app reuses the existing Supabase schema. All tables are in the `public` schema. v2 adds **no breaking changes**; it only relies on the small additions already applied in production after specs 001–009.

### 5.1 Tables

#### `seasons`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text not null | |
| `start_date` | date not null | |
| `end_date` | date not null | `>= start_date` |
| `is_ongoing` | boolean default false | Marks the season as ongoing (a.k.a. "available" in the admin UI — see §6.2 FR-SEA-04) |
| `accent_color` | text not null | Hex `#RRGGBB` |
| `created_at` / `updated_at` | timestamptz | |

#### `cups`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `season_id` | uuid FK→seasons, CASCADE | |
| `name` | text not null | |
| `start_date` / `end_date` | date not null | Must fall within parent season range |

#### `drivers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text unique not null | |
| `name` | text not null | |
| `nickname` | text | |
| `birth_date` | date | |
| `sex` | text | |
| `blood_type` | text | |
| `weight` | numeric / integer | **Added by spec 004.** Informational only — not used in calculations. Nullable. |
| `picture_url` | text | URL in Supabase Storage `driver-pictures` bucket |
| `created_at` / `updated_at` | timestamptz | |

#### `races`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `season_id` | uuid FK→seasons, RESTRICT | Always set, even when assigned to a cup |
| `cup_id` | uuid FK→cups nullable, CASCADE | Optional |
| `name` | text not null | |
| `location` | text not null | |
| `race_datetime` | timestamptz not null | |
| `affects_championship` | boolean default true | If false, race is shown in Calendar but excluded from Overall ranking |
| `created_at` / `updated_at` | timestamptz | |

#### `race_results`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `race_id` | uuid FK→races, CASCADE | |
| `driver_id` | uuid FK→drivers, **CASCADE** (changed in spec 004) | |
| `finish_position` | int not null `> 0` | |
| `grid_start_position` | int | Filled by qualifying import |
| `best_lap_time` | text | `MM:SS.mmm` or `HH:MM:SS.mmm` |
| `is_disqualified` | boolean default false | |
| `comments` | text | |
| `created_at` / `updated_at` | timestamptz | |
| Unique: `(race_id, driver_id)` | | One result per driver per race |

#### `penalties`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `race_result_id` | uuid FK→race_results, CASCADE | |
| `penalty_type` | text not null | One of: `disqualification`, `cone_tire_warning`, `race_direction_warning`, `stop_and_go`, `missing_club_shirt`, `custom` |
| `penalty_name` | text not null | Standard label or custom name |
| `point_deduction` | int not null `<= 0` | Negative or zero |
| `count` | int default 1 `> 0` | |

Standard penalty values: `disqualification = -8`, `cone_tire_warning = -2`, `race_direction_warning = -4`, `stop_and_go = -6`, `missing_club_shirt = -2`. Custom penalties carry their own `point_deduction`.

#### `race_results_log` (audit, spec 009)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `race_result_id` | uuid | Original `race_results.id` |
| `race_id` / `driver_id` | uuid | |
| `finish_position`, `grid_start_position`, `best_lap_time`, `is_disqualified`, `comments` | mirrors `race_results` | Previous row state |
| `created_at` / `updated_at` | timestamptz | Mirrored from previous row |
| `changed_by_user_id` | uuid | Authenticated user who triggered the change |
| `logged_at` | timestamptz default `now()` | |

### 5.2 RLS

See `kartarados/skills/supabase/SKILL.md` for the canonical policy set. Summary:

- Public **read** on `seasons`, `cups`, `races`, `drivers`, `race_results`, `penalties`.
- Authenticated **all** on those same tables (admin = any authenticated user).
- `race_results_log` insert & select restricted to authenticated.

### 5.3 Storage

Bucket `driver-pictures` (public read). Path convention `drivers/<driver-id>/<timestamp>.<ext>`. CORS must allow GET/HEAD from the app's production and local dev origins.

---

## 6. Functional Requirements

> All requirements reflect the **current production behavior**. Where a previous spec contradicted what the code does, the code wins. Notable reconciliations are flagged as **[Reconciled]**.

### 6.1 Auth

- **FR-AUTH-01**: Sign-in uses Supabase Auth email/password.
- **FR-AUTH-02**: Admin accounts are created **directly in the Supabase dashboard** by the project owner. The app exposes **no in-app admin invitation UI**. _[Reconciled — earlier specs described in-app admin creation; current process is dashboard-only.]_
- **FR-AUTH-03**: Authenticated users (= admins) can change their own password from a profile screen.
- **FR-AUTH-04**: Admin routes are protected by a functional `authGuard` that redirects to `/login` when there is no active Supabase session.
- **FR-AUTH-05**: Sign-out clears the Supabase session and any in-memory state, then redirects to the public rankings page.
- **FR-AUTH-06**: The session is persisted by `@supabase/supabase-js` and auto-refreshed.

### 6.2 Seasons

- **FR-SEA-01**: Admins can create, edit, and delete seasons. Fields: `name`, `start_date`, `end_date`, `is_ongoing`, `accent_color`.
- **FR-SEA-02**: Season `end_date` must be ≥ `start_date`. Accent color must be `#RRGGBB`.
- **FR-SEA-03**: Deleting a season prompts a confirmation. Related cups and races cascade through DB constraints. Drivers and `race_results` for those races are removed via cascade chains.
- **FR-SEA-04**: The `is_ongoing` flag is exposed in admin UI as an **availability** toggle. Field name in the DB remains `is_ongoing` for backward compatibility (spec 003 FR-008).
- **FR-SEA-05** _Active season resolution_:
  1. If any season has `is_ongoing = true`, pick the one with the most recent `start_date`.
  2. Otherwise, pick the season with `end_date >= today` (most recent if multiple).
  3. Otherwise, the season with the most recent `end_date`.
- **FR-SEA-06** _Selected season persistence_ (spec 003): the user's selected season id is persisted in `localStorage` under `kt:selectedSeasonId`. All season selectors across the app default to it. If the stored id no longer exists, fall back to FR-SEA-05.
- **FR-SEA-07**: Only `is_ongoing = true` seasons appear in the public Rankings page season `<select>`. Admin pages show all seasons.
- **FR-SEA-08**: When the selected season changes, the app updates `--kt-season-accent`, the navbar background, the footer background, and the active table header accent (see §8).
- **FR-SEA-09**: The cached accent color must be applied **before first paint**. This is done via an inline `<style>` tag in `index.html` that reads the cached value from localStorage at parse time.

### 6.3 Cups

- **FR-CUP-01**: Admins can create, edit, and delete cups within a season.
- **FR-CUP-02**: A cup's `[start_date, end_date]` must fall within its season's range.
- **FR-CUP-03**: Deleting a cup cascades to its races (and their results).

### 6.4 Drivers

- **FR-DRV-01**: Admins can create, edit, and delete drivers.
- **FR-DRV-02**: Fields: `name`, `nickname`, `email` (unique), `birth_date`, `sex`, `blood_type`, `weight` (numeric, informational only — spec 004), `picture_url`.
- **FR-DRV-03**: The driver table shows `name`, `nickname`, `weight`, `picture` thumbnail, actions. **No email column** in the driver list (spec 004).
- **FR-DRV-04**: Email must be unique. Server returns a friendly error on duplicate.
- **FR-DRV-05**: Driver pictures upload to Supabase Storage bucket `driver-pictures` and the public URL is stored on `drivers.picture_url`.
- **FR-DRV-06** _Picture fallback_: when `picture_url` is missing or the image fails to load, render a 200 px headshot-style placeholder from a free generator (DiceBear `avataaars` recommended), seeded from `driver_id || email || name`. Implemented as the `<kt-driver-image>` shared component using a native `(error)` handler.
- **FR-DRV-07** _Cascade delete_ (spec 004): clicking Delete opens a Bootstrap confirmation dialog with the exact text:
  > "Are you sure you want to exclude this driver and all his race results? This cannot be undone."
  On confirm, the driver and all related `race_results` are removed via DB CASCADE. The dialog is built with `ng-bootstrap`'s modal service (no custom CSS).

### 6.5 Races

- **FR-RAC-01**: Admins can create, edit, and delete races. Fields: `name`, `location`, `race_datetime`, `season_id`, `cup_id` (optional), `affects_championship`.
- **FR-RAC-02**: Race list is filterable by season and cup.
- **FR-RAC-03**: Deleting a race cascades to its race results and their penalties.
- **FR-RAC-04**: Clicking a race in the list opens the race detail page, which lists results sorted by `finish_position` ascending.

### 6.6 Race Results

- **FR-RR-01**: Admins can add a driver result to a race. Fields: `finish_position`, `best_lap_time`, `grid_start_position`, `is_disqualified`, `comments`, and one or more penalty entries.
- **FR-RR-02**: A driver may appear at most once per race (`UNIQUE (race_id, driver_id)`). Attempts to add a duplicate return a friendly error.
- **FR-RR-03**: Penalty entries can be standard types (counts per type) or custom (name + negative point deduction + count).
- **FR-RR-04**: Saving a race result with penalties writes the result, then writes the penalty rows. On edit, existing penalties are replaced (delete-by-`race_result_id` then insert).
- **FR-RR-05** _Audit trail_ (spec 009): on every update or delete of a `race_results` row, the previous state plus the authenticated user's id is inserted into `race_results_log` **before** the mutation. The row id is preserved across updates so penalty foreign keys stay valid.
- **FR-RR-06**: Race results remain editable forever by admins. There is no time-window lock. _[Confirmed current behavior.]_

### 6.7 Points & Rankings (Critical — Reconciled)

> **Reconciled rule**: The current production code awards a `+1` bonus for pole position and `+1` bonus for fastest lap **in addition to** finish-position points. Spec 002 had removed those bonuses; the live behaviour preserves them. The v2 spec keeps the bonuses.

#### 6.7.1 Position points table

`{1:35, 2:30, 3:26, 4:23, 5:21, 6:19, 7:18, 8:17, 9:16, 10:15, 11:14, 12:13, 13:12, 14:11, 15:10, 16:9, 17:8, 18:7, 19:6, 20:5, 21:4, 22:3, 23:2, 24:1}`. Any position > 24 → 0 points.

#### 6.7.2 Per-race base points (for a single driver)

```
base = pointsTable[finish_position] || 0
if (driver is pole winner) base += 1
if (driver is fastest-lap winner) base += 1
```

- **Pole winner** = driver with `grid_start_position === 1` for that race.
- **Fastest lap winner** = driver with the smallest valid `best_lap_time` for that race; on time tie, the better finishing position wins.

#### 6.7.3 Per-race penalty points

For each `race_results` row, total penalty points = `Σ (penalty.point_deduction * penalty.count)` over all that row's penalties (signed value, ≤ 0).

#### 6.7.4 Race contribution

A driver's race contribution = `base + penalty_sum` (penalties are negative). Missed races count as 0 for `base` and 0 for penalties.

#### 6.7.5 Discards (spec 002, kept)

- **Cup ranking** (a tab for a specific cup): discard exactly 1 race per driver — the one with the lowest `base` (ties broken by earliest index). Missing-race rows count as a 0-base candidate eligible for discard. Skip the discard entirely if the cup has only 1 race.
- **Overall championship ranking**: discard count = number of distinct cups represented among the season's `affects_championship` races. Races without `cup_id` are not counted toward the discard count.
- **Penalty sums are NEVER discarded.** Even on discarded races the penalty contribution still counts toward the driver's total.

#### 6.7.6 Suspension flag (kept, no UI surfacing — _[Reconciled]_)

Compute `raceDirectionPenaltyPoints = Σ point_deduction * count` for penalties where `penalty_type = 'race_direction_warning'`. If `<= -20`, mark the driver as suspended on the computed ranking object. This field is computed but **not surfaced in the v2 UI** (current behavior).

#### 6.7.7 Sort order (Overall / Cup tabs)

1. Total points DESC.
2. For positions 1..24, more finishes at that position wins (cascading).
3. More poles.
4. More fastest laps.
5. Fewer penalties (i.e. larger / less-negative penalty sum).
6. Earlier `reachedAt` race index (race at which the driver first reached their total).

#### 6.7.8 Penalty tab sort order (spec 005)

1. Total penalties — most penalties first (i.e. most negative penalty sum).
2. Earliest first-penalty race timestamp.
3. Worse finish position in that race.

#### 6.7.9 Penalty tab placement (spec 006)

Penalties tab is **always the last** tab.

### 6.8 Public Rankings Page

- **FR-PR-01**: Public, no auth needed.
- **FR-PR-02**: Always renders for the **selected season** (FR-SEA-05/06).
- **FR-PR-03**: Page contains a season `<select>` (only `is_ongoing` seasons), followed by ng-bootstrap nav-tabs with this exact order:
  1. **Calendar** (default active tab, spec 006).
  2. **Overall championship** (uses races with `affects_championship = true`).
  3. One tab per cup in the season, in `cups.start_date` ascending.
  4. **Penalties** (always last).
- **FR-PR-04** _Calendar tab_ (spec 006):
  - Lists **all** races for the selected season (including `affects_championship = false`).
  - Sort by `race_datetime` ASC; rows without `race_datetime` last.
  - Columns: Race date, Race name (linked to the race detail page when admin is logged in), Location, Winner, Fastest lap.
  - Winner = driver whose `finish_position === 1` in that race; Fastest lap = driver with smallest valid `best_lap_time`.
  - For races in the future or without results, Winner and Fastest lap show "-".
  - Both Winner and Fastest lap cells render via `<kt-driver-image>` + name.
- **FR-PR-05** _Overall and Cup tabs_ — table columns in this order: `Pos`, `Driver`, `Total Points`, `Penalties`, `Best Position` (spec 005). `Driver` cell uses `<kt-driver-image>` + name.
- **FR-PR-06** _Penalty tab_ — same table layout, sorted by §6.7.8.
- **FR-PR-07**: All labels and headers are localized (see §9).
- **FR-PR-08**: Tables are wrapped in `<div class="table-responsive">` for mobile.
- **FR-PR-09**: When the selected season has no races, the body shows a localized empty state.
- **FR-PR-10**: When the selected season has races but no results, each ranking tab shows a localized empty state but the Calendar tab still renders.

### 6.9 OCR Race Results Import (spec 007)

The OCR feature imports either a **race results sheet** or a **qualifying sheet** in Portuguese. It must remain on the static-hosted client.

- **FR-OCR-01**: A "Import via OCR" button appears in the Race Detail page next to "Add Result".
- **FR-OCR-02**: Image input accepts file upload and mobile camera capture (`accept="image/*"`, `capture="environment"`).
- **FR-OCR-03**: Two modes: **Race Results** and **Qualifying**.
- **FR-OCR-04** _Auto-detect sheet type_: from OCR text headers — `"Corrida"` → race results, `"Tomada de Tempo"` → qualifying. If detected type disagrees with the mode the user picked, ask the user to confirm before parsing.
- **FR-OCR-05** _Ordering rule_:
  - Race Results import is **blocked** if the race already has at least one `race_results` row (avoids duplicate `(race_id, driver_id)` violations).
  - Qualifying import is **blocked** until race results exist for the race.
- **FR-OCR-06** _Hybrid provider_:
  - **Auto** mode (default): use Azure Document Intelligence with the `prebuilt-layout` model when `AZURE_VISION_ENDPOINT` and `AZURE_VISION_KEY` are configured. On any failure, fall back to Tesseract.js and notify the user (toast).
  - When Azure is not configured, use Tesseract.js directly with no prompt.
  - Tesseract.js runs entirely in-browser with language `por` and `tessedit_pageseg_mode=6`, `preserve_interword_spaces=1`.
- **FR-OCR-07** _Parsing_:
  - Race Results: extract `finish_position`, `driver_name`, `best_lap_time` (from the `TMV` column).
  - Qualifying: extract `driver_name`, `grid_start_position` (from the `POS` column).
- **FR-OCR-08** _Review step_: parsed rows are shown in a table with original OCR name, parsed position/time, matched driver (selectable from the full driver list), and a per-row Skip toggle.
- **FR-OCR-09** _Driver matching_:
  - Normalize names: strip diacritics, punctuation, extra whitespace; lowercase.
  - Compute similarity (Damerau-Levenshtein or comparable) against all drivers and choose a best match above a configurable threshold.
  - When two or more candidates are similarly close, leave the row unmatched and require manual selection.
- **FR-OCR-10** _Saving Race Results_: create one `race_results` row per matched & non-skipped row with `finish_position` and `best_lap_time`. `grid_start_position` is left empty (filled later by qualifying import).
- **FR-OCR-11** _Saving Qualifying_: update existing `race_results` rows' `grid_start_position` for matched drivers only; ignore other fields.
- **FR-OCR-12** _Post-save_: after a successful save the Race Detail page is reloaded so the new results show up.
- **FR-OCR-13** _Drafts_: the OCR review state is kept in memory or localStorage until the user saves or cancels, then cleared.
- **FR-OCR-14** _Config injection_: Azure endpoint and key are injected at build time from environment variables, the same way Supabase credentials are. Default missing → Tesseract-only.
- **FR-OCR-15** _Bonus (post-MVP, optional)_: capture kart number (`#`) and store it when a column exists.

### 6.10 App Footer (spec 008)

- **FR-FT-01**: Present on every page (public + admin).
- **FR-FT-02**: Background color = `var(--kt-season-accent)` (matches navbar).
- **FR-FT-03**: Left side (desktop):
  - "Created by Lennon Carvalho" → links to https://www.linkedin.com/in/lennoncarvalho/
  - "MIT License" → https://github.com/lennoncarvalho/karting-manager/blob/main/LICENSE
  - "© {year} Lennon Carvalho" — year computed at render time.
- **FR-FT-04**: Right side (desktop):
  - GitHub icon (`bi bi-github`) → https://github.com/lennoncarvalho/karting-manager
  - Language flags: Brazil (PT), UK/US (EN). Click switches locale.
- **FR-FT-05**: On viewports < 768 px, footer stacks vertically (left block above right block).
- **FR-FT-06**: Sticks to bottom of viewport via `min-vh-100 d-flex flex-column` shell; appears after content on long pages.
- **FR-FT-07**: All external links open in a new tab with `rel="noopener noreferrer"`.
- **FR-FT-08**: Language switcher is **removed from the navigation/header** and lives only in the footer.
- **FR-FT-09**: Built with Bootstrap utilities + ng-bootstrap. No custom CSS beyond the `--kt-season-accent` rule already defined in §8.

### 6.11 Production Hardening (spec 009)

- **FR-PH-01** _Build minification_: the production build (Angular CLI with `--configuration=production`) must produce minified JS and CSS. Output goes to `frontend/dist/<app>`. Cloudflare Pages publish directory is set accordingly.
- **FR-PH-02** _Dev build_: `ng serve` continues to serve unminified sources for debugging.
- **FR-PH-03** _Config injection_: environment values (Supabase URL/key, Azure OCR endpoint/key, Sentry DSN) are read from environment variables at build time and written into the appropriate `environment.prod.ts` (or replaced via a build step). Never commit secrets to git.
- **FR-PH-04** _RLS enforced_: see §5.2.
- **FR-PH-05** _Audit log_: see §6.6 FR-RR-05.
- **FR-PH-06** _Loading overlay_: a single global `kt-loading-overlay` (driven by `LoadingService`) shows a backdrop and `cursor: wait` whenever at least one async request is in flight. Buttons that trigger requests must enter a loading state (spinner + disabled) while their handler runs. Implemented as the `loading` input of `kt-button` and as an HTTP interceptor that increments/decrements `LoadingService.inFlight`.
- **FR-PH-07** _No double submits_: forms must be disabled while their submit handler is pending; buttons must not fire a second time until the first request completes.
- **FR-PH-08** _Error reporting_: Sentry initialized at app bootstrap; uncaught errors and Supabase errors are captured (matching v1).

---

## 7. Reusable Components & Services (contracts)

This section enumerates the shared building blocks. Every entry MUST exist; no feature is allowed to inline equivalent markup or logic.

### 7.1 Shared components (`src/app/shared/`)

| Component | Selector | Key inputs | Behavior |
|---|---|---|---|
| Button | `kt-button` | `variant: 'primary'\|'secondary'\|'danger'\|'outline'`, `size: 'sm'\|'md'\|'lg'`, `loading: boolean`, `disabled: boolean`, `iconStart?: string`, `iconEnd?: string`, `type: 'button'\|'submit'` | When `loading=true`: replaces icon with a spinner and disables the click. Emits `click` (typed). All buttons in the app use this. |
| Driver image | `kt-driver-image` | `src?: string`, `seed: string`, `alt: string`, `size: number = 32`, `rounded: boolean = true` | Renders `<img>` with `(error)` falling back to DiceBear `avataaars` URL seeded with `seed`. Used everywhere a driver picture is shown (rankings cells, driver list, race result rows, Calendar winners/fastest). |
| Season select | `kt-season-select` | `availableOnly: boolean = false`, `value: signal/model` | Bound to `SeasonStore`. Persists selection to `kt:selectedSeasonId`. Emits the resolved season object on change. |
| Confirm dialog | `kt-confirm-dialog` | Opened via `ConfirmService.open({ title, body, confirmText, danger? })` | Returns a Promise<boolean>. Built with `NgbModal`. |
| Loading overlay | `kt-loading-overlay` | (no inputs) | Listens to `LoadingService.inFlight() > 0`; renders a full-screen backdrop with spinner and `cursor: wait`. Mounted once in `AppComponent`. |
| Empty state | `kt-empty-state` | `message: string`, `icon?: string` | Renders a Bootstrap `alert alert-info` with optional Bootstrap icon. |
| Form error | `kt-form-error` | `control: AbstractControl` | Renders Bootstrap `invalid-feedback` messages keyed by validator name. Provides localized strings. |
| Flag | `kt-flag` | `code: 'pt-BR'\|'en'`, `size?: number` | Renders the country flag using `flag-icons` classes (`fi fi-br`, `fi fi-gb` / `fi fi-us`). Click is handled by the parent (footer language switcher). |
| Modal shell | `kt-modal` | (project pattern) | Wraps `NgbActiveModal` boilerplate; provides slots for header/body/footer. Optional sugar — feature modals may also use `NgbModal.open()` directly. |

### 7.2 Pipes (`src/app/shared/pipes/`)

| Pipe | Name | Purpose |
|---|---|---|
| Lap time | `lapTime` | Formats a lap time string back into normalized `MM:SS.mmm`. |
| Date time | `dtLocale` | Formats a `timestamptz` for the current locale (wraps Angular's `date` pipe with project defaults). |

### 7.3 Directives (`src/app/shared/`)

| Directive | Selector | Purpose |
|---|---|---|
| Async click | `[ktAsyncClick]` | Higher-level alternative to `kt-button`'s `loading` input. Wraps an `async` handler, sets `LoadingService` and a busy attribute on the host. Use for non-button elements. |
| Accent header | `[ktAccentHeader]` | Adds the `kt-th-accent` class to a `<th>`. Pure sugar so feature templates don't repeat the class name. |

### 7.4 Core services (`src/app/core/`)

| Service | Responsibilities |
|---|---|
| `SupabaseService` | Single `SupabaseClient` instance configured with the anon key. |
| `AuthStore` | `session: signal<Session\|null>`, `user: computed`, `isAuthenticated: computed`. Subscribes once to `onAuthStateChange`. Exposes `signIn`, `signOut`, `updatePassword`. |
| `SeasonStore` | `all: signal<Season[]>`, `available: computed`, `selectedId: signal<string\|null>` (mirrored to `kt:selectedSeasonId`), `selected: computed<Season\|null>`. Methods: `refresh()`, `pickActive()`, `select(id)`. Caches list under `kt:seasonsCache` and a by-id map under `kt:seasonsCacheById`. |
| `ThemeService` | `effect`s on `SeasonStore.selected` and writes `--kt-season-accent`. Also computes the navbar/footer foreground (`--kt-navbar-fg`) for contrast. Persists the active accent under `kt:activeSeasonAccent` for the inline preload in `index.html`. |
| `LoadingService` | `inFlight: signal<number>`. `wrap<T>(p: Promise<T>): Promise<T>` increments and decrements safely. |
| `ConfirmService` | Opens `kt-confirm-dialog`. Returns `Promise<boolean>`. |
| `I18nStore` | Reads current locale; `setLocale(code)` writes it to localStorage and triggers `location.reload()` so Angular bootstraps the locale-specific bundle. |
| `ErrorHandler` | Custom Angular `ErrorHandler` that pipes uncaught errors into Sentry and the toast service. |

### 7.5 Feature services

One service per domain. All return Promises (or signals via `httpResource`/`resource`). All share a `mapSupabaseError(err)` helper for friendly messages (mirrors `handleApiError` in v1).

| Service | Public methods (typed) |
|---|---|
| `SeasonsApi` | `list(opts?)`, `getById(id)`, `create(payload)`, `update(id, payload)`, `delete(id)` |
| `CupsApi` | `list({ seasonId })`, `create`, `update`, `delete` |
| `DriversApi` | `list`, `create`, `update`, `delete`, `uploadPicture(file, driverId)` |
| `RacesApi` | `list({ seasonId?, cupId? })`, `create`, `update`, `delete` |
| `RaceResultsApi` | `listByRace(raceId)`, `listByRaceIds(raceIds)`, `create`, `update` (writes audit row first), `delete` (writes audit row first) |
| `PenaltiesApi` | `createMany(rows)`, `deleteByRaceResult(raceResultId)` |
| `RankingsService` | Pure computation. `calculateRankings(races, results, { type })`, `calculatePenaltyRankings(races, results, options)`. Mirrors §6.7 exactly. |
| `OcrService` | `runOcr(file): Promise<{ text, tables, provider, fallbackUsed }>`. Encapsulates Azure + Tesseract. |
| `OcrParser` | Pure functions: `detectSheetType(text)`, `parseRaceResults(text|tables)`, `parseQualifying(text|tables)`. |
| `DriverMatcher` | Pure: `match(ocrName, drivers, threshold): { driverId?, candidates[] }`. |

### 7.6 HTTP interceptors

- `loadingInterceptor` — increments/decrements `LoadingService.inFlight` on Angular `HttpClient` calls (used for Azure OCR). Supabase calls go through the SDK so they are tracked via `LoadingService.wrap` inside the API services.
- `sentryInterceptor` — adds breadcrumbs for failed responses.

---

## 8. Theming

- Single CSS variable: `--kt-season-accent` (Hex).
- `ThemeService` updates it on every season change.
- Inline `<style>` in `index.html` preloads the cached value from `localStorage.kt:activeSeasonAccent` so the navbar/footer never flash.
- The only project-wide custom CSS in `styles.scss`:

  ```scss
  @import 'bootstrap/scss/bootstrap';
  @import 'bootstrap-icons/font/bootstrap-icons.css';
  @import 'flag-icons/css/flag-icons.min.css';

  :root {
    --kt-season-accent: #000;
    --kt-navbar-fg: #fff;
  }

  .kt-navbar, .kt-footer {
    background-color: var(--kt-season-accent);
    color: var(--kt-navbar-fg);
  }
  .kt-th-accent {
    background-color: var(--kt-season-accent);
    color: var(--kt-navbar-fg);
  }
  ```

- All other styling comes from Bootstrap utilities. Component-level `.scss` files are allowed only when no utility expresses the intent (target: ≤ 3 such files across the whole app).

---

## 9. Internationalization

- **Tooling**: `@angular/localize` (compile-time). The build produces one bundle per locale.
- **Locales**: `pt-BR` (default) and `en`.
- **Source format**: `messages.xlf` per locale under `src/locale/`.
- **Marking**: every user-visible string in templates uses `i18n` attribute with explicit IDs `@@<feature>.<key>`, e.g. `i18n="@@publicRankings.title"`.
- **Plurals / select**: ICU expressions inline.
- **Runtime locale switch** (footer flags):
  1. Persist locale in `localStorage.kt:locale`.
  2. Reload the SPA at the locale-prefixed URL (Cloudflare Pages will serve the correct bundle).
- **Date/time/number formatting**: use Angular's `date`, `decimal`, `currency` pipes with the runtime `LOCALE_ID`.
- **Translation coverage**: 100% parity with v1's `translations/en.json` and `translations/pt-BR.json`. Migrate every existing key to the new `messages.xlf` files. No raw strings in templates.

---

## 10. Testing

Per project decision, testing focuses on critical paths only.

| Area | What to test | How |
|---|---|---|
| `RankingsService` | Position table, pole +1, fastest +1, penalty deduction, cup-only discard, overall multi-cup discard, tie-breakers, penalty tab ordering, suspension flag. | Unit tests (Jest/Vitest) with fabricated `races` + `race_results` fixtures. **Must replicate every example from spec 002 §1 and §2 and from spec 005 §1 word-for-word.** |
| `OcrParser` + `DriverMatcher` | Sheet-type detection, header parsing, accent-insensitive name matching, ambiguous-candidate fallback. | Unit tests with anonymized real-world OCR samples committed under `src/app/features/ocr-import/__tests__/fixtures/`. |
| `authGuard` + `AuthStore` | Redirect when no session; allow when session present. | Unit tests with stubbed Supabase client. |
| Everything else | — | No automated tests. Rely on manual QA + Sentry. |

**No E2E.** **No screenshot tests.**

---

## 11. Build & Deployment

- **Build command** (Cloudflare Pages): `cd frontend && npm ci && npm run build`.
- **Output directory**: `frontend/dist/<app>/browser` (Angular esbuild builder default).
- **SPA fallback**: a `_redirects` file containing `/* /index.html 200` is generated under `public/` so Cloudflare Pages serves `index.html` for client-side routes.
- **Environment variables** (set in Cloudflare Pages project settings):
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `AZURE_VISION_ENDPOINT` (optional)
  - `AZURE_VISION_KEY` (optional)
  - `SENTRY_DSN` (optional)
- **Config injection**: a pre-build Node script (`scripts/inject-env.js`) writes `src/environments/environment.prod.ts` from those env vars. This script is invoked automatically by `npm run build` via the `prebuild` hook.
- **Provider-agnostic**: the same `build` + `_redirects` setup works on Vercel, Netlify, GitHub Pages, etc.
- **GitHub integration**: push to `main` → Cloudflare Pages production deploy. Push to any other branch → Cloudflare Pages preview deploy.

---

## 12. Reconciliation Log (Code vs. Specs 001–009)

The new spec is grounded in the **current production code**. The following items resolve known divergences:

| # | Topic | Spec said | Code does | v2 keeps |
|---|---|---|---|---|
| 1 | Pole / fastest-lap bonus | Spec 002: NO bonus | `+1` for pole, `+1` for fastest | Code wins — bonuses kept (§6.7.2). |
| 2 | Admin invitation | Spec 001: in-app invite | Created in Supabase dashboard | Code wins — no in-app UI (§6.1 FR-AUTH-02). |
| 3 | Driver weight | Spec 004 added field | Stored, displayed, not used in calc | Informational only (§5.1, §6.4 FR-DRV-02). |
| 4 | Suspension UI | Spec 001 required surfacing | Computed but not shown | Computed-only, no UI (§6.7.6). |
| 5 | `is_ongoing` vs "available" | Spec 003 renamed to availability | DB field unchanged | DB stays `is_ongoing`, label is "Available" (§6.2 FR-SEA-04). |
| 6 | race_results immutability | Spec 009 considered locking | Editable forever, audit only | Editable forever (§6.6 FR-RR-06). |
| 7 | Soft-delete | Earlier draft of spec 009 | Reverted — audit log only | Audit log is the canonical mechanism (§6.6 FR-RR-05). |
| 8 | Driver delete FK | Spec 001: RESTRICT | Spec 004 + production: CASCADE | CASCADE (§5.1 `race_results`). |

If any other divergence is discovered during the build, treat the production code as authoritative and add a new row to this log.

---

## 13. Out of Scope

- Multi-tenant / multi-club deployment.
- PWA / offline / service worker.
- SSR / Angular Universal.
- Supabase Realtime subscriptions.
- Supabase Edge Functions.
- New end-user features beyond §6.
- Content Security Policy headers (follow-up).
- Rate limiting (Supabase-side follow-up).
- Privacy/consent banners.
- Visual redesign or new color palette outside what spec 001 (F1-inspired, per-season accent) already mandates.
- Public-facing driver profile pages.
- Statistics dashboards beyond rankings & calendar.

---

## 14. Open Questions / Future Work

These are not blocking but should be revisited:

1. **Move audit-log enforcement to a Postgres trigger** so the client cannot accidentally skip it.
2. **Add a `profiles` table** with a `role` column to distinguish "admin" from "any authenticated user", enabling future read-only collaborator roles.
3. **Add `kart_number` column** to `race_results` to enable FR-OCR-15.
4. **Pole / Fastest-lap bonus toggle per season** — if the club ever wants to align with spec 002's rules, expose `bonus_points_enabled` on `seasons`.
5. **Multi-language footer flags** beyond PT/EN if new translations are added.
6. **Per-table indexes audit** in Supabase as data grows past tens of thousands of `race_results_log` rows.

---

## 15. Success Criteria

- **SC-01**: A new admin can complete initial setup (1 season, 10 drivers, 1 cup, 5 races) in under 10 minutes.
- **SC-02**: An admin can enter race results for 20 drivers in under 5 minutes (manual flow).
- **SC-03**: An admin can OCR-import a 15–25-driver Portuguese race sheet in under 5 minutes including review.
- **SC-04**: ≥ 80% of OCR rows auto-match drivers on first pass for a clean sheet.
- **SC-05**: Public ranking page renders rankings (Overall + Cup + Calendar + Penalties) within 2 seconds of load on broadband.
- **SC-06**: FCP < 1.8 s, LCP < 2.5 s on 4G mid-tier mobile.
- **SC-07**: Points calculations match v1's output 1:1 on a frozen golden dataset (`fixtures/golden/`).
- **SC-08**: Tie-breaker rules (§6.7.7) match v1 100% on golden dataset.
- **SC-09**: All v1 i18n keys are translated in both locales; no raw strings in templates.
- **SC-10**: Season accent color is applied to navbar, footer, and active table header within one paint of selection change.
- **SC-11**: All admin-only mutations are denied by RLS to unauthenticated requests (verified manually with `curl` + anon key).
- **SC-12**: Every update/delete on `race_results` creates a corresponding `race_results_log` row with non-null `changed_by_user_id`.
- **SC-13**: No duplicate `(race_id, driver_id)` rows can be created via OCR or manual entry (unique-constraint enforced).
- **SC-14**: Initial JS bundle ≤ 250 KB gzipped; admin routes lazy-loaded.
- **SC-15**: 100% of buttons in the app are rendered through `<kt-button>`; 100% of driver pictures through `<kt-driver-image>`. Verified via lint rule (`no-restricted-syntax` on raw `<button>` / `<img>` for driver photos) or a quick grep at PR time.

---

## 16. References

- Skills: `kartarados/skills/angular/SKILL.md`, `kartarados/skills/bootstrap/SKILL.md`, `kartarados/skills/supabase/SKILL.md`.
- Historical specs (superseded but useful as context): `kartarados/specs/001-championship-manager/` … `009-production-hardening/`.
- Current v1 code (source of truth): `frontend/src/`.
- Angular docs: https://angular.dev
- ng-bootstrap: https://ng-bootstrap.github.io
- Supabase docs: https://supabase.com/docs
- Bootstrap 5: https://getbootstrap.com/docs/5.3/
- Azure Document Intelligence: https://learn.microsoft.com/azure/ai-services/document-intelligence/
- Tesseract.js: https://github.com/naptha/tesseract.js
