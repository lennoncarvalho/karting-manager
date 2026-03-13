# Kartarados - Championship Manager

A vanilla JavaScript web application for managing go-kart racing championships with Formula 1-inspired design.

## Features

- **Admin Management**: Create and manage seasons, drivers, cups, and races
- **Race Results**: Enter detailed race results with penalties and disqualifications
- **Points System**: Complex points calculation with tie-breakers (Brazilian go-kart regulations)
- **Public Rankings**: Real-time driver rankings with cup and overall championship tabs
- **Formula 1 Design**: Modern, responsive interface with season-based accent colors

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build**: Vite (dev server + production bundling/minification)
- **UI Framework**: Bootstrap 5.3 (CDN) with custom F1 theme overrides
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Libraries**: All loaded from CDNs (Bootstrap, Supabase JS)

## Quick Start

### Prerequisites

- Supabase account (free tier)
- Modern web browser
- Node.js + npm (for Vite dev/build)

### Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project URL and anon key (Settings → API)

2. **Configure Frontend**
   - Update `frontend/src/config.js` with your Supabase credentials:
     ```javascript
     export const SUPABASE_URL = 'https://[your-project-ref].supabase.co';
     export const SUPABASE_ANON_KEY = 'your-anon-key';
     ```

3. **Setup Database**
   - See `specs/001-championship-manager/quickstart.md` → "Database Setup"
   - Run the SQL scripts in Supabase SQL Editor

4. **Create First Admin**
   - See `specs/001-championship-manager/quickstart.md` → "Create First Admin"
   - **First Admin Password**: [GENERATE RANDOM PASSWORD AND DOCUMENT HERE]

5. **Start Development Server**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Open Application**
   - Navigate to the URL printed by Vite (typically `http://localhost:5173`)
   - Log in with first admin credentials

## Development / Build / Deploy (Vite)

### Develop (live reload / HMR)

```bash
cd frontend
npm install
npm run dev
```

### Build (production bundle)

```bash
cd frontend
npm run build
```

Output is written to `frontend/dist/` (minified JS/CSS + processed assets).

### Preview production build locally

```bash
cd frontend
npm run preview
```

### Deploy (Cloudflare Pages)

Recommended configuration:

- **Root directory**: `frontend`
- **Build command**: `../build.sh`
- **Build output directory**: `dist`
- **Environment variables** (Cloudflare dashboard): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `AZURE_VISION_ENDPOINT`, `AZURE_VISION_KEY`

The build script injects environment values into `frontend/src/config.js` and then runs the Vite build.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── services/       # API and business logic
│   ├── utils/          # Utility functions
│   └── styles/         # CSS files
└── index.html          # Entry point

backend/
└── functions/          # Serverless functions (if needed)
```

## Local Development

The app runs locally and connects to your remote Supabase project:

- ✅ Frontend runs on the Vite dev server (default `localhost:5173`)
- ✅ Connects to remote Supabase (database, auth, storage)
- ✅ No local database setup needed
- ✅ CORS automatically handled by Supabase

See `specs/001-championship-manager/quickstart.md` → "Local Development Setup" for details.

## Assets (important)

Because the app is now built with Vite, **do not hardcode `src/...` paths** inside JavaScript-rendered HTML.

- **In JS modules (recommended)**: import the asset and use the returned URL:

```js
import logoUrl from '../assets/icons/kartarados_3grays.png';
// ...
img.src = logoUrl;
```

- **In `index.html`**: you can keep `href="src/..."` and Vite will rewrite it during build (for example, the favicon becomes a hashed `/assets/...` URL in `dist/index.html`).

This ensures assets work in both `npm run dev` and the built `dist/` output.

## Documentation

- **Specification**: `specs/001-championship-manager/spec.md`
- **Implementation Plan**: `specs/001-championship-manager/plan.md`
- **Tasks**: `specs/001-championship-manager/tasks.md`
- **Data Model**: `specs/001-championship-manager/data-model.md`
- **API Contracts**: `specs/001-championship-manager/contracts/api-contracts.md`
- **Quick Start**: `specs/001-championship-manager/quickstart.md`

## Constitution

This project follows the Kartarados Constitution principles:
- Code Quality (NON-NEGOTIABLE)
- Mobile-First Design
- User Experience Consistency
- Performance Requirements

See `.specify/memory/constitution.md` for details.

## License

- Free to use for your own club.
- Youre welcome to fork it and submit PRs with improvements.
- Not for comercial use.
