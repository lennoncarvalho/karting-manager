# React Kartarados — Development Rules

## Structure

This repo has three React apps for the Kartarados go-kart championship manager:

- **`frontend/`** — Original vanilla JS app, Vite-based, production-deployed to Cloudflare Pages. Uses `VITE_` env vars injected via `build.sh`. Has Sentry instrumentation.
- **`react/`** — React rewrite. Uses React, React Router, Supabase JS SDK directly. `@/` path alias resolves to `react/src` (see `react/vite.config.js`).
- **`kartarados/`** — Spec/design documents and skills from speckit. Reference only, not active code.

**When working on active code, `react/` is the primary codebase.** `frontend/` is legacy/canary.

## Commands

```bash
cd react && npm run dev      # Dev server on localhost:8000
cd react && npm run build    # Production build → react/dist/
cd frontend && npm run dev   # Legacy app on localhost:8000
cd frontend && npm run build # Production build using ../build.sh (Cloudflare Pages)
```

Production deploys via Cloudflare Pages. `build.sh` injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AZURE_VISION_*`, `SENTRY_*` into `frontend/src/config.js` at build time. **Never commit hardcoded secrets** — all env vars go through the build script or `.env` files (gitignored).

## Code Style

- Functional components with hooks only. No class components.
- JSX: `noValidate` (not `novalidate`), `className` (not `class`).
- Use `@/` alias for `react/src` imports — e.g. `@/lib/api`, `@/context/AuthContext`.
- Prettier for formatting. Check touched files.

## Routing

- `react-router-dom` with `BrowserRouter`. No hash-based routing.
- Use `<Link to="/path" />` and `useNavigate()` for navigation.
- Dynamic routes use URL search params: `/admin/race?id={id}`.

## State & Context

- **`SeasonContext`** (`@/context/SeasonContext`) — Manages seasons and season selection. **Always append to season array, never replace entirely** — `setSeasons(prev => [...prev, newSeason])` (see `react/src/context/SeasonContext.jsx:83`).
- **`AuthContext`** (`@/context/AuthContext`) — `useAuth()` hook access. Wraps async auth with `loading` state.
- **`LoadingContext`** — `useLoadingOverlay()` hook provides `(loading, withLoading)` for wrapping async operations.

## API Layer

- **All** API calls go through functions in `@/lib/api`. Never call Supabase directly from components.
- `@/lib/supabase` exports the initialized `supabase` client — use it only within `@/lib/api`.
- Race result mutations (`createRaceResult`, `updateRaceResult`, `deleteRaceResult`) log to `race_results_log` audit table. The logged row's drivers/penalties are stripped out before writing to the audit table.
- Season data is cached in `localStorage` under keys `seasonsCache` and `seasonsCacheById`. Cache is invalidated on create/update/delete.

## OCR

- Azure Document Intelligence (primary) + Tesseract.js (fallback). Implementations in `@/lib/ocr` and `@/lib/ocrParsing`.
- OCR drafts persisted to `localStorage`.

## Components & UI

- **Images**: Use `DriverImage` from `@/lib/driverImage` — **never** raw `<img>` with `dangerouslySetInnerHTML`.
- **Toasts**: `useToast()` from `@/components/Notification`.
- **Modals**: `ConfirmModal`, `RaceResultModal`, `OcrImportModal` in `@/components/modals/`.
- **Layout**: `Navbar`, `Footer`, `MainContent` in `@/components/layout/`.
- Bootstrap 5.3 from CDN. Accent colors driven by `season.accent_color` CSS variable `--season-accent`.

## i18n

- `react-i18next` with `pt-BR` (default) and `en` (fallback).
- All UI strings use `t('namespace.key')`.
- In utility/formatting functions, use `i18next.t.bind(i18next)` — **never** `useTranslation()` hook outside a component.
- Translation files: `@/i18n/resources/en.json`, `@/i18n/resources/pt-BR.json`.

## React Hooks Rules

- Hooks **never** inside plain functions (utilities, formatters, etc.).
- All hooks at top level of components — no conditional or loop hook calls.

## Vite / Build

- `react/` uses `@vitejs/plugin-react` with esbuild minification and sourcemaps.
- `frontend/` uses `@sentry/vite-plugin` for Sentry release tracking.
- Assets imported in JS via standard ES import (e.g. `import logo from '../assets/logo.png'`) — Vite rewrites for dev and prod.
- `frontend/src/config.js` is a **build artifact** — do not hand-edit it. Run the build to regenerate.

## Sentry

- `frontend/` has Sentry (`@sentry/browser`, `@sentry/vite-plugin`). Configured via `SENTRY_DSN` env var.
- `react/` has `@sentry/react` — initialize via `@/lib/sentry.js`.

## Testing

- No test framework configured. Before finishing a task: `npm run build` to verify no compile errors.
