# Requirements

## Overview

Two intertwined goals for this iteration of `app/`:

1. **Apply the user's decisions on the six "Suggestions worth discussing"** from `app/IMPLEMENTATION-STATUS.md`, plus the seven follow-up Open Decisions.
2. **Continue porting the remaining v1 features** (🟡 / ⚪ items in the same file) **and** realign the new Angular components' HTML/CSS structure with the v1 frontend.

The v1 code under `frontend/` remains the visual and behavioural source of truth. The new app at `app/` does not delete or modify v1.

## Decisions captured

 # | Topic | User decision |
---|---|---|
 Sugg-1 | Driver picture upload as a shared component | ✅ Build `<kt-driver-image-uploader>` |
 Sugg-2 | Server-side audit trigger (Postgres) | ⏸ Skip for later |
 Sugg-3 | `profiles` table with `role` column | ⏸ Skip for later |
 Sugg-4 | Per-season toggle for pole/FL bonus | ❌ No toggle — pole/FL +1 is always canonical |
 Sugg-5 | Generated Supabase DB types | 📄 Own numbered spec `011`, implementation deferred |
 Sugg-6 | Skeleton loaders | ✅ Quick win — add `<kt-skeleton-row>` |
 Open-1 | UI library | ✅ Always prefer ng-bootstrap + Bootstrap utilities |
 Open-2 | OCR layout | ✅ Split into feature module with single-responsibility files |
 Open-3 | Skeleton scope | ✅ Tables only |
 Open-4 | Accent helpers | ✅ Fully remove `.kt-*` accent classes and `[ktAccentHeader]` |
 Open-5 | DB-types plan | ✅ Own numbered spec |
 Open-6 | Password reset | ✅ In-app via `supabase.auth.updateUser({ password })` |
 Open-7 | Spec edit scope | ✅ Broader cleanup pass of spec 010 |

## In scope

- Global UI: ng-bootstrap + Bootstrap utilities; theming through `var(--kt-season-accent)` only.
- Remove three `kt-*` accent helpers and `[ktAccentHeader]`.
- Restore v1 navbar and footer.
- Replace segmented-button rankings with `nav-tabs`: Calendar / Overall / per-cup / Penalties.
- Re-skin admin CRUD pages to v1 `card.shadow-sm` form-on-left / table-on-right layout.
- Port v1 RaceResultModal as `<kt-race-result-modal>`.
- Redesign v1 OcrImportModal as feature module under `features/race-detail/ocr/` with 8 single-responsibility files.
- Populate `messages.{pt-BR,en}.xlf` from v1 JSON.
- Add `/auth/reset-password` route.
- Edit spec 010 in a broader cleanup pass.
- Create `kartarados/specs/011-generated-db-types/spec.md`.

## Out of scope

- Suggestions #2, #3.
- Suggestion #5 implementation — only spec is created.
- Anything under `frontend/` or `build.sh`.
- New features beyond spec 010.

# Technical Design

## Key decisions

1. Direct theming via global SCSS, remove three `kt-*` helpers and `[ktAccentHeader]`.
2. Pole/Fastest-lap +1 is canonical (no toggle, no reconciliation).
3. Generated DB types live in new spec 011 (deferred).
4. OCR import launched from race-detail page, not separate route.
5. Both modals use ng-bootstrap `NgbModal`.
6. OCR is its own redesigned feature module with single-responsibility files.
7. `<kt-driver-image-uploader>` shared component with `[(value)]` and `bucket` input.
8. `<kt-skeleton-row>` generic table skeleton.
9. i18n migration via committed Node script reading v1 JSON.
10. Password reset at `/auth/reset-password` uses `supabase.auth.updateUser({ password })`.
11. Spec cleanup is broader than surgical, end-to-end sweep, no version bump.

## Components — what changes

 Component | Status | Change |
---|---|---|
 `app/src/styles.scss` | rewrite | Remove 3 accent helpers; add v1 global themed selectors; dark body |
 `layout/navigation/` | rewrite HTML | Dark themed navbar via ng-bootstrap |
 `layout/footer/` | rewrite HTML | Themed footer using Bootstrap utilities |
 `shared/kt-driver-image-uploader/` | new | File input + preview + Supabase upload |
 `shared/kt-skeleton-row/` | new | Generic `placeholder-glow` rows |
 `shared/directives/accent-header.directive.ts` | DELETE | Global selectors replace it |
 `features/public-rankings/` | rewrite | NgbNav tabs + skeleton |
 `features/race-detail/` | rewrite | v1 layout; modals via NgbModal |
 `features/race-detail/modals/kt-race-result-modal/` | new | Full port |
 `features/race-detail/ocr/` | NEW feature module | 8 single-responsibility files |
 `features/drivers/` | rewrite | v1 layout + uploader |
 `features/{seasons,cups,races,login,admin-dashboard}/` | re-skin | v1 cards |
 `features/auth/reset-password/` | new | `auth.updateUser` form |
 `app.routes.ts` | edit | `/auth/reset-password` |
 `messages.{en,pt-BR}.xlf` | populate | From v1 JSON |
 `scripts/migrate-json-to-xlf.mjs` | new | Helper |
 `core/points.ts` (header) | edit | Drop "divergence" |
 `kartarados/specs/010-angular-rewrite/spec.md` | broader edit | Cleanup pass |
 `kartarados/specs/011-generated-db-types/spec.md` | new | Numbered spec |

## Architecture diagram

```mermaid
graph TD
  RD[features/race-detail] -->|NgbModal.open| RRM[kt-race-result-modal]
  RD -->|NgbModal.open| OIM[kt-ocr-import-modal shell]
  RRM -->|ApiService| API[core/api.service]
  subgraph OCR[features/race-detail/ocr/]
    OIM --> PRE[ocr-image-preprocessor]
    OIM --> PAR[ocr-parser]
    OIM --> MAT[ocr-driver-matcher]
    OIM --> DRA[ocr-draft.service]
    OIM --> SAV[ocr-save.service]
    OIM --> ICR[ocr-image-cropper]
    OIM --> ORT[ocr-review-table]
  end
  PRE --> OCS[core/ocr.service]
  SAV --> API
  DRV[features/drivers] -->|@value| UPL[kt-driver-image-uploader]
  UPL -->|storage.upload| SB[(SupabaseService)]
  PR[features/public-rankings] -->|NgbNav tabs| TABS[Calendar · Overall · per-Cup · Penalties]
  THEME[ThemeService] -->|--kt-season-accent| STYLES[(styles.scss)]
```

## Risks

- Visual regression on existing features — mitigate via HTML/SCSS-only edits.
- OCR redesign is more than a port — lift pure utilities first with tests.
- Removing `[ktAccentHeader]` from many templates — single search-and-replace pass.
- Spec cleanup pass broader than initially planned — section-by-section review, no version bump.

# Open Decisions (resolved)

All seven Open Decisions resolved by the user:

1. **Modals & components** ✅ Always prefer ng-bootstrap and Bootstrap utility classes.
2. **OCR file layout** ✅ Properly-designed feature module with one responsibility per file.
3. **Skeleton loaders scope** ✅ Tables only.
4. **Accent helpers** ✅ Fully remove `.kt-th-accent`, `.kt-text-accent`, `.kt-border-accent`, `[ktAccentHeader]`.
5. **Generated DB types plan location** ✅ `kartarados/specs/011-generated-db-types/spec.md`.
6. **Password reset flow** ✅ In-app via `supabase.auth.updateUser({ password })` at `/auth/reset-password`.
7. **Spec edit scope** ✅ Broader cleanup pass on spec 010; create spec 011.

# Delivery Steps

###   Step 1: Spec cleanup pass + new spec 011 + code-comment alignment
Spec 010 reads as a clean, stack-agnostic specification; spec 011 documents the generated-DB-types plan; code comments stop using "divergence" framing.

- **Spec 010 cleanup pass** (`kartarados/specs/010-angular-rewrite/spec.md`):
  - Rewrite §6.7 lead paragraph so pole/FL +1 is the canonical rule (no "spec 002", "reconciliation", "divergence").
  - Drop the pole/FL row from the §12 reconciliation table; remove any other pure-divergence rows. Renumber survivors.
  - Drop item #4 from §14 Open Questions; renumber remaining items.
  - Sweep for Angular-specific implementation leakage; replace with framework-agnostic phrasing or move into a clearly-marked "Implementation notes (Angular)" sub-section.
  - Add Changelog entry at top.
  - No spec number bump.
- **Create `kartarados/specs/011-generated-db-types/spec.md`** with sections: Goal, Motivation, Inputs, Generation command, Facade pattern in `core/models.ts`, `prebuild` script outline, CI env requirements, Rollout steps, Acceptance criteria. Status: Planned — deferred.
- **Code-comment alignment**:
  - Edit `app/src/app/core/points.ts` header JSDoc to remove "divergence" wording.
  - Edit `app/src/app/core/points.spec.ts` describe names to treat the bonus as a normal feature.
- Update `app/IMPLEMENTATION-STATUS.md`: mark Sugg-4 closed, Sugg-5 spec created/deferred, Open-7 done.

###   Step 2: Global theming + V1 layout shells (Navigation + Footer) — Bootstrap-first
Body, navbar, and footer visually match v1; global theme rules apply on every Bootstrap surface; navigation and footer use ng-bootstrap + Bootstrap utilities only.

- Rewrite `app/src/styles.scss`:
  - Keep `@use 'bootstrap/scss/bootstrap' as *` and `@use 'flag-icons/sass/flag-icons' as * with (...)`.
  - Set body to v1 dark theme (#000 bg, white text, Arial/Helvetica) and bold/letter-spaced headings.
  - Map `--kt-season-accent` to `.table thead th`, `.navbar`, `.btn-primary` + hover, `.card-header`, `.modal-header`, `.badge-primary`, `.nav-tabs .nav-link.active`, `.progress-bar`, `a` / `a:hover`, `*:focus`, `::selection` via `:where(...)` wrapper.
  - Delete `.kt-th-accent` / `.kt-text-accent` / `.kt-border-accent` rules.
- Delete `app/src/app/shared/directives/accent-header.directive.ts` and remove every `ktAccentHeader` / `kt-text-accent` / `kt-border-accent` usage from existing templates.
- Ensure `kartarados_3grays.png` exists in `app/src/assets/icons/`.
- Rewrite `layout/navigation/navigation.component.html` with `nav.navbar.navbar-expand-lg.navbar-dark`, `kartarados_3grays.png` brand at 80 px, `NgbCollapse` for toggle, anonymous links when `!isAdmin()`, authenticated links + `NgbDropdown` user-email dropdown with Logout.
- Rewrite `layout/footer/footer.component.html` using utility classes only: themed bg via `var(--kt-season-accent)`, two-column row with LinkedIn/license/copyright + GitHub + flag buttons. Keep `<kt-flag>` and locale-swap behaviour.

###   Step 3: New shared components — kt-driver-image-uploader and kt-skeleton-row
Two shared building blocks land that the next stages depend on.

- Create `app/src/app/shared/kt-driver-image-uploader/`:
  - Standalone, OnPush, signals; separated `.ts` / `.html` / `.scss` (`.scss` empty).
  - Inputs: `bucket` (default `'driver-pictures'`), `name` (for fallback avatar).
  - Model: `value` (two-way bindable `string | null`).
  - Internal signals: `busy`, `error`.
  - On file selection: read file input, generate unique filename, call `SupabaseService.client.storage.from(bucket).upload(...)` then `.getPublicUrl(...)`, emit URL via `value.set(url)`. Surface errors via `error` signal.
  - Preview reuses `<kt-driver-image>` for the fallback avatar.
- Create `app/src/app/shared/kt-skeleton-row/`:
  - Standalone, takes `[columns]` (default 4) and `[rows]` (default 5).
  - Renders `<tr><td>` placeholders using Bootstrap `placeholder-glow` / `placeholder` utility classes with varied widths.
  - Used inside `<tbody>` while a table is loading.
- Add a Vitest sanity test for the uploader's URL emission (Supabase client mocked).

###   Step 4: Admin pages V1 layout pass — drivers (with uploader), seasons, cups, races, admin-dashboard, login
All admin CRUD pages and login/dashboard pages visually match v1; drivers form uses the new uploader.

- Rewrite `features/drivers/`:
  - v1 `.row.g-4` with `.col-lg-4` form card and `.col-lg-8` table card; themed `.card-header.text-white`.
  - Replace `picture_url` `<input type="url">` with `<kt-driver-image-uploader [(value)]="form.picture_url" [name]="form.name" />`.
  - Rows v1-style: `<kt-driver-image>` + name flex row, weight, nickname, birth date, actions.
  - Loading: `<kt-skeleton-row [columns]="5" />`.
- Re-skin `features/seasons/`, `cups/`, `races/` to the same form-on-left / table-on-right card pattern. Template-only changes.
- Re-skin `features/admin-dashboard/` to v1 tile/card grid. Add a tile/note explaining OCR import is launched from each Race Detail page.
- Re-skin `features/login/` to v1 `.card.shadow-sm` form + themed header; add `Forgot password?` link → `/auth/reset-password` (route in stage 7).
- Verify `routerLinkActive` styling reads correctly with global accent.

###   Step 5: Race detail page + kt-race-result-modal (full RaceResultModal port)
Race detail page matches v1 layout; admins can add/edit a result + penalties through a single ng-bootstrap modal.

- Rewrite `features/race-detail/race-detail.component.html` to mirror v1:
  - Title row + buttons: `Add result`, `Import via OCR` (wired in stage 6), `Back to races`.
  - Race info card with date/time, season name, affects championship.
  - Results card with themed `.card-header` and `<table.table.table-striped.align-middle>` matching v1 columns: position, driver, grid, best lap (underline if fastest), penalties, DQ, actions.
  - Skeleton rows while loading.
- Create `features/race-detail/modals/kt-race-result-modal/`:
  - Full port of `frontend/src/components/RaceResultModal.js` (~251 LOC) to standalone, OnPush, signal-driven Angular component.
  - `modal-lg` ng-bootstrap modal; themed header.
  - Form fields: driver (existing-driver dedup), finish position, grid start, best lap time, disqualified, comments.
  - Standard penalties grid (5 hard-coded entries) + dynamic custom-penalty rows.
  - Validation parity with v1.
  - Emits typed payload via `NgbActiveModal.close({ id?, result, penalties })`.
- Wire `race-detail` Add/Edit actions to `NgbModal.open(KtRaceResultModalComponent, { size: 'lg' })`, then `ApiService.createRaceResult` / `updateRaceResult` + `createPenalties` / `replacePenalties` (audit-log preserved).

###   Step 6: OCR feature module — redesigned single-responsibility split
OCR import is a redesigned feature module under `app/src/app/features/race-detail/ocr/` where each file has a single responsibility.

- `ocr-parser.ts` (pure): port of `frontend/src/utils/parsing.js`. `detectSheetType`, `parseOcrRows`.
- `ocr-driver-matcher.ts` (pure): port of `frontend/src/utils/matching.js`. `normalize`, `matchDriverName`.
- `ocr-image-preprocessor.service.ts` (injectable): canvas/imaging — crop, auto-enhance, contrast, monochrome threshold. Returns a processed `Blob`.
- `ocr-draft.service.ts` (injectable): localStorage draft persistence keyed by `ocrImportDraft:{raceId}` (`load`, `save`, `clear`).
- `ocr-save.service.ts` (injectable): orchestrates final save. `saveRaceResults` loops `createRaceResult` + `createPenalties`; `saveQualifying` loops `updateRaceResult` setting only `grid_start_position`.
- `ocr-image-cropper.component.ts` (standalone sub-component): crop card UI (enhance toggle, contrast slider, threshold toggle, preview canvas). Outputs processed `Blob`.
- `ocr-review-table.component.ts` (standalone sub-component): parsed-rows review table with original OCR name, parsed position/time, matched-driver `<select>`, per-row skip toggle.
- `kt-ocr-import-modal.component.ts` (thin shell ≤ 200 LOC): mode select, provider banner, file/camera input, gate warnings, assembly. Closes with imported-row count.
- Tests under `features/race-detail/ocr/__tests__/`: Vitest for parser (race + qualifying sample) and matcher (fuzzy + ambiguous case).
- Wire race-detail `Import via OCR` button to `NgbModal.open(KtOcrImportModalComponent, { size: 'lg' })`.
- Update `IMPLEMENTATION-STATUS.md` to flip drivers (picture upload), race-detail, and ocr-import from 🟡 to ✅.

###   Step 7: Public rankings nav-tabs + i18n XLIFF population + password reset route
Public rankings matches v1 visually and functionally, both locales have full translation parity, and the Supabase password-recovery deep link works.

- Rewrite `features/public-rankings/public-rankings.component.html`:
  - `.container.mt-4` page with a season `<select>` (only `is_ongoing` seasons) and a small title.
  - ng-bootstrap `<ul ngbNav [(activeId)]>` tabs: Calendar (default), Overall, one per cup (sorted by `cups.start_date` asc), Penalties (last).
  - Calendar tab: table with Race date, Race name (link if admin), Location, Winner (`<kt-driver-image>` + name), Fastest lap.
  - Overall / Cup / Penalties tabs: v1 ranking table using `core/points.ts`.
  - Skeleton rows while loading; localized empty states.
- Create `scripts/migrate-json-to-xlf.mjs`:
  - Reads `frontend/src/translations/{en,pt-BR}.json`, walks i18n keys from extracted `messages.xlf`, emits `<target>` blocks in `app/src/locale/messages.{en,pt-BR}.xlf`.
  - Document workflow in `app/README.md`.
- Run the script; commit populated XLIFFs. Add `npm run i18n:sync` script.
- Create `features/auth/reset-password/reset-password.component.{ts,html,scss}`:
  - Standalone, OnPush, two-field form (new password / confirm), submits via `AuthStore.updatePassword(newPassword)` wrapping `supabase.auth.updateUser({ password })`.
  - Accepts `PASSWORD_RECOVERY` session from `onAuthStateChange`.
  - Fallback (if complex): link to Supabase's password-management page.
- Register `{ path: 'auth/reset-password', loadComponent: ... }` in `app.routes.ts`.
- Final pass on `IMPLEMENTATION-STATUS.md`: tick public-rankings, locale stubs, password-reset route; close suggestions list with summary table.