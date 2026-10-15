# Kartarados — Development Rules

## Structure

Single React app at repo root:

| Directory  | Stack                        |
| ---------- | ---------------------------- |
| `src/`     | React 19 + Vite 8            |
| `.agents/` | Skills + specs for AI agents |

## Commands

```bash
npm run dev                    # localhost:8000
npm run build                  # → dist/
```

Pre-verification: `npm run build` (only no-test fallback — no test framework).

## Env & Secrets

- **Never commit secrets.** `.env` is gitignored and is what local dev reads. `@/lib/supabase.js` has **no** in-code fallbacks — it throws if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing (loud failure over silently shipping a broken/hardcoded bundle).

### Cloudflare Pages env vars (project `kartarados`)

Cloudflare Pages passes environment variables to the build process. Vite reads `VITE_`-prefixed vars and injects them into the bundle at build time via `import.meta.env`. Build-time-only vars without the `VITE_` prefix are read by tooling from `process.env` and never reach the bundle.

| CF dashboard var          | Read by                                                   | Required                         |
| ------------------------- | --------------------------------------------------------- | -------------------------------- |
| `VITE_SUPABASE_URL`       | `@/lib/supabase.js`                                       | yes                              |
| `VITE_SUPABASE_ANON_KEY`  | `@/lib/supabase.js`                                       | yes                              |
| `VITE_APP_URL`            | `@/lib/auth.js` (OAuth `emailRedirectTo`)                 | no — set the production URL      |
| `VITE_AZURE_ENDPOINT`     | `@/lib/ocr.js`                                            | no (Tesseract.js fallback)       |
| `VITE_AZURE_KEY`          | `@/lib/ocr.js`                                            | no (Tesseract.js fallback)       |
| `VITE_SENTRY_DSN`         | `@/lib/sentry.js` (runtime init gate)                     | no                               |
| `VITE_SENTRY_ENVIRONMENT` | `@/lib/sentry.js`                                         | no (defaults `production`)       |
| `SENTRY_AUTH_TOKEN`       | `vite.config.js` → `@sentry/vite-plugin` sourcemap upload | no (upload skipped if unset)     |
| `SENTRY_ORG`              | `vite.config.js`                                          | no (defaults `lennon-carvalho`)  |
| `SENTRY_PROJECT`          | `vite.config.js`                                          | no (defaults `javascript-react`) |

Build-time-only vars (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) are read from `process.env` by the Vite plugin and are **never** injected into the bundle.

⚠️ `VITE_AZURE_KEY` is currently embedded in the client bundle. The intended fix is to proxy OCR calls through a **Cloudflare Pages Function** — a handful of handler lines in `functions/api/ocr.js`, deployed alongside the Pages app with no separate backend needed — so the key stays server-side. Tesseract.js is the fallback when the key is missing/unavailable.

### Cloudflare Pages build config (project `kartarados`)

| Field                  | Value           |
| ---------------------- | --------------- |
| Root directory         | `.` (repo root) |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Build comments         | Enabled         |

Cloudflare Pages auto-installs dependencies and runs `npm run build` (Vite). Node version is pinned by `.nvmrc` (Vite 8 needs ≥20.19 / 22.12).

## Code Style

- Functional components + hooks only. No class components.
- `className`, `noValidate` (React JSX conventions).
- `@/` alias → `src/` (see `vite.config.js`).
- Use Prettier defaults.

## Routing

- `react-router-dom` `BrowserRouter`. Hash-free.
- Dynamic routes use URL search params: `/admin/race?id={id}`.

## Context & State

| Context          | Hook           | Notes                                                                                    |
| ---------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `AuthContext`    | `useAuth()`    | Async init with `loading` state. Wraps supabase auth.                                    |
| `SeasonContext`  | `useSeason()`  | **Always append** seasons, never replace: `setSeasons(prev => [...prev, newSeason])`     |
| `LoadingContext` | `useLoading()` | Returns `{ show, hide, withLoading }`. Global overlay.                                   |
| `ToastProvider`  | `useToast()`   | `notify(message, type)` — types: `success`, `error`, `warning`, `info`. Auto-dismiss 3s. |

## API Layer

- **All** data calls through `@/lib/api`. Components never call Supabase directly.
- `@/lib/supabase` exports the client — used by `api.js`, `auth.js`, and `AuthContext.jsx` (the auth listener).
- Race result mutations (`createRaceResult`, `updateRaceResult`, `deleteRaceResult`) log to `race_results_log` audit table. `drivers` and `penalties` columns are stripped before writing.
- Season data cached in `localStorage` under `seasonsCache` / `seasonsCacheById`. Invalidated on create/update/delete.

## OCR

- **Primary**: Azure Document Intelligence (`@/lib/ocr.js` — reads `VITE_AZURE_ENDPOINT`, `VITE_AZURE_KEY`).
- **Fallback**: Tesseract.js (`por` language).
- **Security**: `VITE_AZURE_KEY` is currently client-side. The intended fix is a Cloudflare Pages Function proxy — see the env table note above.
- OCR drafts persisted to `localStorage`.

## i18n

- `react-i18next`. Default: `pt-BR`, fallback: `en`.
- Config-based (`@/i18n/config.js`), not auto-detected from browser.
- `t('namespace.key')` in components. In utility functions, use `i18next.t.bind(i18next)` — never `useTranslation()` outside a component.
- Translation files: `@/i18n/resources/{en,pt-BR}.json`.

## UI Components

- **Bootstrap 5.3** from npm: `import "bootstrap/dist/css/bootstrap.min.css"` + `import * as bootstrap from "bootstrap"`.
- **Driver images**: Use `<DriverImage>` from `@/components/driverImage`. Falls back to DiceBear placeholder when no `src` provided or image fails to load.
- Accent colors from `season.accent_color` drive CSS variable `--season-accent`.
- Layout: `Navbar`, `Footer`, `MainContent` in `@/components/layout/`.
- Modals: `ConfirmModal`, `RaceResultModal`, `OcrImportModal` in `@/components/modals/`.

## Sentry

- `@sentry/react` is a dependency and is imported directly by `@/lib/api` and `@/lib/auth` for `captureException`. No `Sentry.init()` call is wired anywhere — Sentry is not initialized in the app's entrypoint.

## Vite / Build

- `@vitejs/plugin-react`, esbuild minification, sourcemaps on.

## Hooks Rules

- Hooks **never** inside plain functions (utilities, formatters, etc.).
- All hooks at top level of components — no conditional or loop calls.

## .agents/ Folder

Skills and specs live under `.agents/`:

- `.agents/skills/` — project-level skill documents (React best practices, Supabase)
- `.agents/specs/` — historical feature specs (001 through 012)
