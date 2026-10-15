# Implementation Plan: Penalty Rankings Tab

**Branch**: `005-penalty-rankings` | **Date**: 2026-01-30 | **Spec**: `specs/005-penalty-rankings/spec.md`
**Input**: Feature specification from `/specs/005-penalty-rankings/spec.md`

## Summary

Add a penalties ranking tab on PublicRankings, sort drivers by penalty totals with defined tie-breakers, and add penalties columns across all ranking tables while ensuring Total Points appears directly after Driver.

## Technical Context

**Language/Version**: JavaScript (ES modules)  
**Primary Dependencies**: Browser DOM APIs, Bootstrap (UI)  
**Storage**: N/A  
**Testing**: NEEDS CLARIFICATION (no test harness identified)  
**Target Platform**: Web browser  
**Project Type**: web  
**Performance Goals**: N/A  
**Constraints**: Keep ranking calculations deterministic; reuse existing race/driver aggregation

## Constitution Check

- **Code Quality**: Centralize penalty ranking logic in `points.js` to avoid duplication.
- **Mobile-First**: Ensure table columns remain readable on small screens.
- **UX Consistency**: Follow existing tabs and table styling.
- **Performance**: Avoid extra API calls; reuse loaded race results.

No exceptions anticipated.

## Project Structure

### Documentation (this feature)

```text
specs/005-penalty-rankings/
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
│   └── services/
│       └── points.js
```

**Structure Decision**: Web application under `frontend/`, with calculation updates in points service and rendering updates in PublicRankings.

## Complexity Tracking

None.
