# Implementation Plan: Season Selector Persistence

**Branch**: `003-season-selector` | **Date**: 2026-01-29 | **Spec**: `specs/003-season-selector/spec.md`
**Input**: Feature specification from `/specs/003-season-selector/spec.md`

## Summary

Replace the PublicRankings season label with a season selector, persist the selected season in local storage, refresh rankings and accent colors on selection, and default all season selectors across the app to the stored season while preserving the existing default-season fallback logic. PublicRankings must only show seasons marked available.

## Technical Context

**Language/Version**: JavaScript (ES modules)  
**Primary Dependencies**: Browser DOM APIs, Bootstrap (UI)  
**Storage**: LocalStorage for selected season ID (reusing existing access patterns)  
**Testing**: NEEDS CLARIFICATION (no test harness identified)  
**Target Platform**: Web browser  
**Project Type**: web  
**Performance Goals**: N/A (client-side updates)  
**Constraints**: Maintain existing default-season logic when stored season is missing/invalid; avoid conflicting season selection sources; PublicRankings only uses available seasons  
**Scale/Scope**: Season selector and rankings update flows

## Constitution Check

- **Code Quality**: Keep selection logic centralized and consistent; avoid duplication across pages.
- **Mobile-First**: Selector must fit within existing responsive header layouts.
- **UX Consistency**: Use existing season selector patterns on other pages.
- **Performance**: Avoid redundant data fetching when switching seasons if cached data exists.

No exceptions anticipated.

## Project Structure

### Documentation (this feature)

```text
specs/003-season-selector/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── PublicRankings.js
│   ├── services/
│   │   └── theme.js
│   ├── utils/
│   │   └── helpers.js
│   └── components/
│       └── [existing season selectors]
```

**Structure Decision**: Web application under `frontend/`. Changes will focus on PublicRankings and shared season-selection helpers/services used by other pages, while integrating with existing default-season logic in `frontend/src/services/theme.js`.

## Complexity Tracking

None.
