# Kartarados — Championship Manager

A React application for managing go-kart racing championships with Formula 1-inspired design.

## Features

- **Admin Management**: Create and manage seasons, drivers, cups, and races
- **Race Results**: Enter detailed race results with penalties and disqualifications
- **Points System**: Complex points calculation with tie-breakers (Brazilian go-kart regulations)
- **Public Rankings**: Real-time driver rankings with cup and overall championship tabs
- **OCR Import**: Import race results from photos using Azure Document Intelligence (Tesseract.js fallback)
- **Formula 1 Design**: Modern, responsive interface with season-based accent colors

## Tech Stack

- **Frontend**: React 19, Vite 8
- **UI Framework**: Bootstrap 5.3 (npm) with Bootstrap Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **i18n**: react-i18next (pt-BR default, en fallback)
- **OCR**: Azure Document Intelligence + Tesseract.js
- **Error Tracking**: Sentry

## Quick Start

### Prerequisites

- Supabase account (free tier)
- Node.js ≥22

### Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project URL and anon key (Settings → API)

2. **Configure Environment**
   - Create `.env` from Supabase credentials:
     ```
     VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Setup Database**
   - See `.agents/specs/001-championship-manager/quickstart.md` → "Database Setup"
   - Run the SQL scripts in Supabase SQL Editor

4. **Create First Admin**
   - See `.agents/specs/001-championship-manager/quickstart.md` → "Create First Admin"

5. **Start Development Server**

   ```bash
   npm install
   npm run dev
   ```

6. **Open Application**
   - Navigate to `http://localhost:8000`
   - Log in with first admin credentials

## Development

```bash
npm install                     # dependencies
npm run dev                     # dev server → localhost:8000
npm run build                   # production bundle → dist/
npm run preview                 # preview the production build locally
npm run lint                    # ESLint
npm run format:check            # Prettier
node scripts/check-size.mjs     # bundle size (budget: 1200 kB gzip)
```

### Deploy (Cloudflare Pages)

- **Root directory**: `.` (repo root)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variables** (Cloudflare dashboard):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (required). Optional:
  `VITE_APP_URL`, `VITE_AZURE_ENDPOINT`, `VITE_AZURE_KEY`,
  `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`.
  `SENTRY_AUTH_TOKEN` is build-time-only (read by `@sentry/vite-plugin` for
  sourcemap upload), never injected into the bundle.

See `AGENTS.md` → "Env & Secrets" for the full variable table.

## Project Structure

```
├── src/                     # Application source
│   ├── components/          # Reusable UI components
│   │   └── layout/          # Navbar, Footer, MainContent
│   │   └── modals/          # ConfirmModal, RaceResultModal, OcrImportModal
│   ├── context/             # AuthContext, SeasonContext, LoadingContext
│   ├── i18n/                # Translations (pt-BR, en)
│   ├── lib/                 # API, auth, formatting, OCR, points, Sentry, Supabase
│   ├── pages/               # Page-level components
│   └── styles/              # CSS
├── public/                  # Static assets (_redirects for SPA fallback)
├── scripts/                 # check-size.mjs
├── .agents/                 # Skills + specs for AI agents
│   ├── skills/              # React best practices, Supabase
│   └── specs/               # Historical feature specs (001–012)
├── index.html               # SPA entry point
├── vite.config.js           # Vite configuration
└── AGENTS.md                # Development rules for AI agents
```

## Local Development

The app runs locally and connects to your remote Supabase project:

- ✅ Dev server at `localhost:8000`
- ✅ Connects to remote Supabase (database, auth, storage)
- ✅ No local database setup needed
- ✅ CORS automatically handled by Supabase

## Documentation

- **Development Rules**: `AGENTS.md`
- **Specifications**: `.agents/specs/`
- **Skills**: `.agents/skills/README.md`

## License

- Free to use for your own club.
- You're welcome to fork it and submit PRs with improvements.
- Not for commercial use.
