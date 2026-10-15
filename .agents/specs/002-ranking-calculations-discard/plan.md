# Implementation Plan: Ranking Calculations With Discards

**Branch**: `002-ranking-calculations-discard` | **Date**: 2026-01-28 | **Spec**: `specs/002-ranking-calculations-discard/spec.md`
**Input**: Feature specification from `/specs/002-ranking-calculations-discard/spec.md`

## Summary

Update ranking calculations to discard worst or missed results per cup, apply one discard per cup in overall standings, remove pole/fastest bonus points, and keep penalties applied even when a race is discarded.

## Technical Context

**Language/Version**: JavaScript (ES modules)  
**Primary Dependencies**: Browser DOM APIs, Bootstrap (UI)  
**Storage**: N/A (read-only ranking calculation)  
**Testing**: NEEDS CLARIFICATION (no test harness identified)  
**Target Platform**: Web browser  
**Project Type**: web  
**Performance Goals**: N/A (client-side aggregation)  
**Constraints**: Ranking calculations must remain deterministic and stable for tie-breakers  
**Scale/Scope**: Season-level standings for a single active season

## Constitution Check

- **Code Quality**: Changes are localized to calculation utilities and ranking page wiring; keep functions readable with clear names.
- **Mobile-First**: No layout changes planned; existing responsive table remains.
- **UX Consistency**: Ranking display unchanged; totals reflect updated rules only.
- **Performance**: Aggregation stays in-memory; ensure loops remain linear in race results.

No exceptions anticipated.

## Project Structure

### Documentation (this feature)

```text
specs/002-ranking-calculations-discard/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
└── (not touched for this feature)

frontend/
├── src/
│   ├── pages/
│   │   └── PublicRankings.js
│   └── services/
│       └── points.js
```

**Structure Decision**: Web application with `frontend/` and `backend/`. This feature is scoped to `frontend/src/services/points.js` and possibly `frontend/src/pages/PublicRankings.js` if calculation inputs need adjustments.

## Complexity Tracking

None.
