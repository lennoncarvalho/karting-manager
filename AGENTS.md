# Kartarados — Development Rules

## Structure

Two apps in the repo, all for the same go-kart championship manager:

| Directory | Stack | Status |
|---|---|---|
| `frontend/` | Vanilla JS + Vite | Legacy (read-only reference — source of truth) |
| `react/` | React 19 + Vite 8 | Active rewrite |
| `kartarados/` | Specs + skills only | Reference, not active code |

**`frontend/` is read-only source of truth.** Consult it for business rules, UI patterns, and behavior — never modify files there. All development is in `react/`.

**Dead code cleanup rule:** When removing orphaned code from `react/`, first check `frontend/` for an equivalent implementation. If the code exists in `frontend/` but has no counterpart in `react/`, do not delete — instead, at the end of your response, suggest implementing it in `react/` with a suggested prompt.

## Commands

```bash
# react/ (primary)
cd react && npm run dev          # localhost:8000
cd react && npm run build        # → react/dist/
bash build.sh                    # from repo root → full CF pipeline (selects react/)

# frontend/ (read-only — reference only)
cd frontend && npm run dev       # localhost:8000 (reference only)
bash ../build.sh                 # from frontend/ → legacy pipeline (config.js injection + vite build)
```

Pre-verification: `npm run build` (only no-test fallback — no test framework).

## Env & Secrets

- **Never commit secrets.** `react/.env` is gitignored and is what local dev reads. `@/lib/supabase.js` has **no** in-code fallbacks — it throws if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing (loud failure over silently shipping a broken/hardcoded bundle).
- `frontend/`: `build.sh` (legacy mode) injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AZURE_VISION_*`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT` into `src/config.js`. `SENTRY_AUTH_TOKEN` is **not** injected — `@sentry/vite-plugin` reads it from `process.env` at build time. **`src/config.js` is a build artifact — don't hand-edit.**

### Cloudflare Pages env vars (project `kartarados`)

Dashboard names have **no `VITE_` prefix**. `build.sh` bridges them: it exports `VITE_*` copies at build time because Vite only injects `VITE_`-prefixed vars into the bundle. **Do not rename the dashboard vars** — the bridge keeps the legacy names working for both apps.

| CF dashboard var | Vite name | Read by | Required |
|---|---|---|---|
| `SUPABASE_URL` | `VITE_SUPABASE_URL` | `@/lib/supabase.js` | yes |
| `SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` | `@/lib/supabase.js` | yes |
| `APP_URL` | `VITE_APP_URL` | `@/lib/auth.js` (OAuth `emailRedirectTo`) | no — set the production URL |
| `AZURE_VISION_ENDPOINT` | `VITE_AZURE_ENDPOINT` | `@/lib/ocr.js` | no (Tesseract.js fallback) |
| `AZURE_VISION_KEY` | `VITE_AZURE_KEY` | `@/lib/ocr.js` | no (Tesseract.js fallback) |
| `SENTRY_DSN` | `VITE_SENTRY_DSN` | `@/lib/sentry.js` (runtime init gate) | no |
| `SENTRY_ENVIRONMENT` | `VITE_SENTRY_ENVIRONMENT` | `@/lib/sentry.js` | no (defaults `production`) |
| `SENTRY_AUTH_TOKEN` | — (build-time only) | `vite.config.js` → `@sentry/vite-plugin` sourcemap upload | no (upload skipped if unset) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | — (build-time only) | `vite.config.js` | no (defaults `lennon-carvalho` / `javascript-react`) |

Build-time-only vars (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) are read from `process.env` by the Vite plugin and are **never** injected into the bundle.

⚠️ `AZURE_VISION_KEY` (`VITE_AZURE_KEY`) is currently embedded in the client bundle (same as the legacy production deployment). The intended fix is to proxy OCR calls through a **Cloudflare Pages Function** — a handful of handler lines in `react/functions/api/ocr.js`, deployed alongside the Pages app with no separate backend needed — so the key stays server-side. Tesseract.js is the fallback when the key is missing/unavailable.

### Cloudflare Pages build config (project `kartarados`)

Current (React app):

| Field | Value |
|---|---|
| Root directory | `react` |
| Build command | `bash ../build.sh` |
| Build output directory | `dist` (resolves to `react/dist`) |
| Build comments | Enabled |

`build.sh` picks the app from the CWD (CF runs the build command from the root directory): CWD `frontend/` → legacy pipeline (config.js injection + `npm run build`); anything else → React (`npm ci && npm run build`, fails fast when `SUPABASE_URL` / `SUPABASE_ANON_KEY` are missing, refuses to finish unless `dist/index.html` and `dist/_redirects` exist). Node version is pinned by `react/.nvmrc` (Vite 8 needs ≥20.19 / 22.12).

**Rollback** = set the root directory back to `frontend` (build command and output dir are unchanged). Then re-deploy; `frontend/` is fully deployable.

## Code Style

- Functional components + hooks only. No class components.
- `className`, `noValidate` (React JSX conventions).
- `@/` alias → `react/src/` (see `react/vite.config.js`).
- Use Prettier defaults.

## Routing (`react/`)

- `react-router-dom` `BrowserRouter`. Hash-free.
- Dynamic routes use URL search params: `/admin/race?id={id}`.

## Context & State (`react/`)

| Context | Hook | Notes |
|---|---|---|
| `AuthContext` | `useAuth()` | Async init with `loading` state. Wraps supabase auth. |
| `SeasonContext` | `useSeason()` | **Always append** seasons, never replace: `setSeasons(prev => [...prev, newSeason])` |
| `LoadingContext` | `useLoading()` | Returns `{ show, hide, withLoading }`. Global overlay. |
| `ToastProvider` | `useToast()` | `notify(message, type)` — types: `success`, `error`, `warning`, `info`. Auto-dismiss 3s. |

## API Layer (`react/`)

- **All** data calls through `@/lib/api`. Components never call Supabase directly.
- `@/lib/supabase` exports the client — used by `api.js`, `auth.js`, and `AuthContext.jsx` (the auth listener).
- Race result mutations (`createRaceResult`, `updateRaceResult`, `deleteRaceResult`) log to `race_results_log` audit table. `drivers` and `penalties` columns are stripped before writing.
- Season data cached in `localStorage` under `seasonsCache` / `seasonsCacheById`. Invalidated on create/update/delete.

## OCR (`react/`)

- **Primary**: Azure Document Intelligence (`@/lib/ocr.js` — reads `VITE_AZURE_ENDPOINT`, `VITE_AZURE_KEY`).
- **Fallback**: Tesseract.js (`por` language).
- **Security**: `VITE_AZURE_KEY` is currently client-side (same as the legacy production deployment). The intended fix is a Cloudflare Pages Function proxy — see the env table note above.
- OCR drafts persisted to `localStorage`.

## i18n (`react/`)

- `react-i18next`. Default: `pt-BR`, fallback: `en`.
- Config-based (`@/i18n/config.js`), not auto-detected from browser.
- `t('namespace.key')` in components. In utility functions, use `i18next.t.bind(i18next)` — never `useTranslation()` outside a component.
- Translation files: `@/i18n/resources/{en,pt-BR}.json`.

## UI Components (`react/`)

- **Bootstrap 5.3** from npm: `import "bootstrap/dist/css/bootstrap.min.css"` + `import * as bootstrap from "bootstrap"`.
- **Driver images**: Use `<DriverImage>` from `@/components/driverImage`. Falls back to DiceBear placeholder when no `src` provided or image fails to load.
- Accent colors from `season.accent_color` drive CSS variable `--season-accent`.
- Layout: `Navbar`, `Footer`, `MainContent` in `@/components/layout/`.
- Modals: `ConfirmModal`, `RaceResultModal`, `OcrImportModal` in `@/components/modals/`.

## Sentry (`react/`)

- `@sentry/react` is a dependency and is imported directly by `@/lib/api` and `@/lib/auth` for `captureException`. No `Sentry.init()` call is wired anywhere — Sentry is not initialized in the React app's entrypoint.

## Vite / Build

- `react/`: `@vitejs/plugin-react`, esbuild minification, sourcemaps on.
- `frontend/`: Sentry Vite plugin for release tracking (duplicated plugin in config).

## Hooks Rules

- Hooks **never** inside plain functions (utilities, formatters, etc.).
- All hooks at top level of components — no conditional or loop calls.
