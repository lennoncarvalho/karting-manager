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
- **UI Framework**: Bootstrap 5.3 (CDN) with custom F1 theme overrides
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Libraries**: All loaded from CDNs (Bootstrap, Supabase JS)

## Quick Start

### Prerequisites

- Supabase account (free tier)
- Modern web browser
- Local HTTP server (Python, Node.js, or VS Code Live Server)

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
   python -m http.server 8000
   # or: npx serve
   # or: VS Code Live Server extension
   ```

6. **Open Application**
   - Navigate to `http://localhost:8000`
   - Log in with first admin credentials

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

- ✅ Frontend runs on `localhost:8000`
- ✅ Connects to remote Supabase (database, auth, storage)
- ✅ No local database setup needed
- ✅ CORS automatically handled by Supabase

See `specs/001-championship-manager/quickstart.md` → "Local Development Setup" for details.

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

[Add license information]
