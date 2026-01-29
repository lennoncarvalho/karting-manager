# Implementation Plan: Kartarados Championship Manager

**Branch**: `001-championship-manager` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-championship-manager/spec.md`

## Summary

Kartarados is a vanilla JavaScript web application for managing go-kart racing championships. The system allows admins to create seasons, drivers, cups, and races, then enter race results with a complex points calculation system. Public users can view driver rankings with Formula 1-inspired theming. The application uses a backend API with database (free-tier hosting services) for data persistence, ensuring simplicity and free hosting while maintaining performance and mobile-first design.

## Technical Context

**Language/Version**: JavaScript (ES6+), HTML5, CSS3  
**Primary Dependencies**: 
- Frontend: Vanilla JavaScript (no frameworks), Bootstrap CSS (CDN), custom CSS overrides
- Backend: Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
- Authentication: Supabase Auth (email/password)
- Image Storage: Supabase Storage (1GB free tier)
- Libraries: All loaded from public CDNs (Bootstrap, Supabase JS, etc.)

**Storage**: Supabase PostgreSQL database with Row Level Security (RLS) policies  
**Development Environment**: 
- Frontend runs locally (vanilla JS, no build step required)
- Connects to remote Supabase project via Supabase JS client (CDN)
- Local HTTP server (Python, Node.js, or VS Code Live Server)
- All data persists in remote Supabase (database, auth, storage)
- CORS automatically handled by Supabase (localhost allowed)
**Testing**: 
- Frontend: Browser-based testing (manual + automated with Jest/Vitest if needed)
- Backend: API testing via Supabase dashboard and client
- E2E: Browser DevTools, Lighthouse for performance

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions), mobile browsers (iOS Safari, Chrome Mobile)  
**Project Type**: web (frontend + backend API)  
**Performance Goals**: 
- FCP < 1.8s, LCP < 2.5s, TTI < 5s
- API response p95 < 200ms
- JavaScript bundle < 200KB gzipped
- Mobile 3G network: functional within 5 seconds

**Constraints**: 
- Must use free-tier hosting services
- Vanilla JavaScript (no frameworks) for simplicity
- Bootstrap CSS for components and theming (loaded from CDN)
- Custom CSS overrides for Formula 1-inspired design theme
- Season-based accent color theming
- All third-party libraries loaded from public CDNs
- Mobile-first responsive design (320px to 4K)

**Scale/Scope**: 
- 50+ drivers per season
- 20+ races per season
- Multiple seasons (historical data)
- Real-time rankings calculations
- Public-facing with admin authentication

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 (Initial)

Verify compliance with Kartarados Constitution principles:

- **Code Quality**: ✅ Technical approach supports maintainable, testable code. Vanilla JS enables clear structure. Code organization and documentation will be prioritized.
- **Mobile-First**: ✅ Design prioritizes mobile devices; responsive across 320px-4K; 3G performance targets explicitly defined in constraints.
- **UX Consistency**: ✅ UI follows Formula 1-inspired design system; interaction patterns will be consistent; WCAG 2.1 AA compliance required.
- **Performance**: ✅ Performance budgets explicitly defined (FCP < 1.8s, LCP < 2.5s, bundle < 200KB gzipped, API p95 < 200ms).

**Status**: ✅ All constitution principles can be met with the proposed technical approach.

### Post-Phase 1 (After Design)

**Re-evaluation after design phase**:

- **Code Quality**: ✅ Supabase backend provides clean API, vanilla JS frontend enables maintainable code structure. Bootstrap components provide consistent structure. Database schema well-documented.
- **Mobile-First**: ✅ Bootstrap responsive grid system, touch targets (44px) specified, mobile-first approach built into Bootstrap.
- **UX Consistency**: ✅ Bootstrap components ensure consistency, Formula 1 design theme via CSS overrides, CSS variables for season theming, consistent component structure.
- **Performance**: ✅ Client-side points calculation reduces API calls, CDN-based libraries (Bootstrap, Supabase) for fast delivery, image optimization specified, Supabase CDN for assets.

**Status**: ✅ All constitution principles remain satisfied after design phase. No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-championship-manager/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Button.js
│   │   ├── Table.js
│   │   ├── Modal.js
│   │   ├── Form.js
│   │   └── Navigation.js
│   ├── pages/           # Page-level components
│   │   ├── LoginPage.js
│   │   ├── AdminDashboard.js
│   │   ├── SeasonManagement.js
│   │   ├── DriverManagement.js
│   │   ├── RaceManagement.js
│   │   ├── RaceDetail.js
│   │   └── PublicRankings.js
│   ├── services/        # API and business logic
│   │   ├── api.js        # API client
│   │   ├── auth.js       # Authentication service
│   │   ├── points.js     # Points calculation logic
│   │   └── theme.js      # Theme/color management
│   ├── utils/           # Utility functions
│   │   ├── validation.js
│   │   ├── formatting.js
│   │   └── helpers.js
│   ├── styles/          # CSS files
│   │   ├── main.css      # Main stylesheet
│   │   ├── bootstrap-overrides.css  # Bootstrap component overrides
│   │   ├── theme.css     # F1 theme and season accent colors
│   │   └── custom.css    # Custom components and utilities
│   └── index.html       # Entry point
├── assets/              # Static assets
│   ├── images/
│   └── icons/
└── tests/               # Frontend tests (if needed)
    └── unit/

backend/
├── functions/           # Serverless functions (if using Firebase/Supabase)
│   ├── auth.js
│   ├── seasons.js
│   ├── drivers.js
│   ├── races.js
│   └── rankings.js
└── rules/               # Security rules (Firestore/PostgreSQL)
    └── rules.json
```

**Structure Decision**: Web application structure with separate frontend and backend directories. Frontend uses vanilla JavaScript with component-based organization for maintainability. Bootstrap CSS loaded from CDN provides component library and responsive grid. Custom CSS overrides for Formula 1 theming and season accent colors. All third-party libraries loaded from public CDNs. Backend uses serverless functions approach compatible with free-tier BaaS services (Supabase Edge Functions).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution principles can be met with the proposed approach.
