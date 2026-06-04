# Kartarados v2 — Angular Rewrite

This folder contains the Angular 19+ rewrite of Kartarados. It is the implementation of
[`kartarados/specs/010-angular-rewrite/spec.md`](../kartarados/specs/010-angular-rewrite/spec.md)
and follows the skills under [`kartarados/skills/`](../kartarados/skills/).

The v1 app (`../frontend/`) is still the production build. `app/` is the parallel
project that will replace it once feature parity is reached.

---

## Quickstart

The project layout was created by hand so the agent could check it into the repo
without running an interactive `ng new`. To finish the setup on your machine:

```bash
cd app
npm install
npm run dev          # ng serve
```

If you ever want to re-create the project from scratch with the CLI, the
equivalent command is:

```bash
npx -y @angular/cli@19 new kartarados \
  --directory=. \
  --routing=true \
  --standalone=true \
  --style=scss \
  --strict=true \
  --ssr=false \
  --skip-git=true \
  --skip-tests=true \
  --package-manager=npm
```

…then copy the files from this folder on top of the generated tree.

## Environment variables

Copy `.env.example` to `.env.local` (Angular CLI does **not** auto-load it; the
values are baked into `src/environments/environment.ts` at build time — see that
file's header for instructions).

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | yes | Project URL `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | yes | Anon public key |
| `AZURE_VISION_ENDPOINT` | no | Azure Document Intelligence endpoint (OCR primary) |
| `AZURE_VISION_KEY` | no | Azure Document Intelligence key |
| `SENTRY_DSN` | no | Sentry DSN for error monitoring |
| `APP_URL` | no | Public app URL (used for password reset redirects) |

If Azure vars are missing the OCR flow falls back to Tesseract.js (`por`).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | `ng serve` on `http://localhost:4200` |
| `npm run build` | Production build (Cloudflare Pages output → `dist/`) |
| `npm run build:prod` | Same as `build`, explicit |
| `npm run lint` | Lint via `ng lint` (optional, only if `@angular-eslint` installed) |
| `npm run i18n:extract` | Extract `messages.xlf` (run after touching `i18n` strings) |
| `npm run i18n:sync` | Extract then back-fill `<target>` tags in `messages.{en,pt-BR}.xlf` from v1's `frontend/src/translations/{en,pt-BR}.json` (see `scripts/migrate-json-to-xlf.mjs`) |
| `npm test` | Vitest (only critical-path tests: points engine, OCR parsing, auth guard) |

## i18n

- Default locale: `pt-BR`
- Available: `pt-BR`, `en`
- Build command produces one bundle per locale under `dist/<locale>/`.
- Translation files: `src/locale/messages.pt-BR.xlf`, `src/locale/messages.en.xlf`.
- Migration workflow: `npm run i18n:sync` extracts current template strings via
  `ng extract-i18n` and then runs `scripts/migrate-json-to-xlf.mjs`, which uses
  the v1 dotted-key JSON files in `../frontend/src/translations/` as the lookup
  table. The script matches `<source>` text (English) to `en.json` leaf values,
  then emits the corresponding `pt-BR.json` value as `<target>`. Strings that
  exist in templates but not in v1 JSON stay untranslated;
  `i18nMissingTranslation: "warning"` (set in `angular.json`) flags them at
  build time so they can be filled in manually.

## Deployment

Cloudflare Pages (current target):

- Build command: `npm run build`
- Build output dir: `dist/kartarados/browser/pt-BR`
- (Optional) `_redirects` ships in `src/` to enable SPA fallback.

## Layout

See `src/app/` for `core/`, `shared/`, `layout/`, `features/`. The boundary rules
from §4 of the spec are enforced manually (no NgModules; everything standalone).

## Status

This scaffold provides:

- Full project skeleton (`package.json`, `angular.json`, `tsconfig*`, `index.html`, `main.ts`, `app.config.ts`, `app.routes.ts`)
- Core services (Supabase client, Auth store, Auth guard, Season store, Theme service, Loading service, Error handler)
- Points engine ported from v1 (`core/points.ts`) with type definitions
- Shared `kt-*` components (button, driver-image, season-select, confirm-dialog, loading-overlay, empty-state, form-error, flag) + pipes + directives
- Layout (Navigation, Footer, App shell)
- Feature pages — see `features/` (some pages are foundational scaffolds with TODO markers where v1 logic still needs to be ported)
- Translations copied from `../frontend/src/translations/` and converted to XLIFF

See `IMPLEMENTATION-STATUS.md` for the per-feature parity checklist.
