# Kartarados — Development Rules

## Structure

Two apps in the repo, all for the same go-kart championship manager:

| Directory | Stack | Status |
|---|---|---|
| `frontend/` | Vanilla JS + Vite | Legacy (read-only reference — source of truth) |
| `react/` | React 18 + Vite | Active rewrite |
| `kartarados/` | Specs + skills only | Reference, not active code |

**`frontend/` is read-only source of truth.** Consult it for business rules, UI patterns, and behavior — never modify files there. All development is in `react/`.

## Commands

```bash
# react/ (primary)
cd react && npm run dev          # localhost:8000
cd react && npm run build        # → react/dist/

# frontend/ (read-only — reference only)
cd frontend && npm run dev       # localhost:8000 (reference only)
cd frontend && npm run build     # runs build.sh → injects env into src/config.js
```

Pre-verification: `npm run build` (only no-test fallback — no test framework).

## Env & Secrets

- `react/`: uses `import.meta.env.VITE_*` (`.env` gitignored). `@/lib/supabase.js` has fallback defaults for dev.
- `frontend/`: `build.sh` injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AZURE_VISION_*`, `SENTRY_*` into `src/config.js`. **`src/config.js` is a build artifact — don't hand-edit.**
- **Never commit secrets.**

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

A standalone `useLoadingOverlay()` hook also exists at `@/lib/useLoadingOverlay` (local state, not context).

## API Layer (`react/`)

- **All** data calls through `@/lib/api`. Components never call Supabase directly.
- `@/lib/supabase` exports the client — used by `api.js`, `auth.js`, and `AuthContext.jsx` (the auth listener).
- Race result mutations (`createRaceResult`, `updateRaceResult`, `deleteRaceResult`) log to `race_results_log` audit table. `drivers` and `penalties` columns are stripped before writing.
- Season data cached in `localStorage` under `seasonsCache` / `seasonsCacheById`. Invalidated on create/update/delete.

## OCR (`react/`)

- **Primary**: Azure Document Intelligence (`@/lib/ocr.js` — reads `VITE_AZURE_ENDPOINT`, `VITE_AZURE_KEY`).
- **Fallback**: Tesseract.js (`por` language).
- OCR drafts persisted to `localStorage`.

## i18n (`react/`)

- `react-i18next`. Default: `pt-BR`, fallback: `en`.
- Config-based (`@/i18n/config.js`), not auto-detected from browser.
- `t('namespace.key')` in components. In utility functions, use `i18next.t.bind(i18next)` — never `useTranslation()` outside a component.
- Translation files: `@/i18n/resources/{en,pt-BR}.json`.

## UI Components (`react/`)

- **Bootstrap 5.3** from npm: `import "bootstrap/dist/css/bootstrap.min.css"` + `import * as bootstrap from "bootstrap"`.
- **Driver images**: Use `<DriverImage>` from `@/lib/driverImage`. Falls back to DiceBear placeholder when no `src` provided or image fails to load.
- Accent colors from `season.accent_color` drive CSS variable `--season-accent`.
- Layout: `Navbar`, `Footer`, `MainContent` in `@/components/layout/`.
- Modals: `ConfirmModal`, `RaceResultModal`, `OcrImportModal` in `@/components/modals/`.

## Sentry (`react/`)

- `@sentry/react` is a dependency and `@/lib/sentry.js` defines `Sentry.init()`, but it's **never imported** anywhere — Sentry is not wired into the React app's entrypoint. API/auth modules import `@sentry/react` directly for `captureException`.

## Vite / Build

- `react/`: `@vitejs/plugin-react`, esbuild minification, sourcemaps on.
- `frontend/`: Sentry Vite plugin for release tracking (duplicated plugin in config).

## Hooks Rules

- Hooks **never** inside plain functions (utilities, formatters, etc.).
- All hooks at top level of components — no conditional or loop calls.
