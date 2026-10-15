# Implementation Plan: Driver Weight And Cascade Delete

**Branch**: `004-driver-weight-delete` | **Date**: 2026-01-29 | **Spec**: `specs/004-driver-weight-delete/spec.md`
**Input**: Feature specification from `/specs/004-driver-weight-delete/spec.md`

## Summary

Add a weight field to driver records and display it in the drivers table, replace the email column, and ensure driver deletion confirms intent and cascades to race results via database constraint updates.

## Technical Context

**Language/Version**: JavaScript (ES modules)  
**Primary Dependencies**: Browser DOM APIs, Bootstrap (UI), Supabase (DB)  
**Storage**: Supabase Postgres  
**Testing**: NEEDS CLARIFICATION (no test harness identified)  
**Target Platform**: Web browser  
**Project Type**: web  
**Performance Goals**: N/A  
**Constraints**: Preserve existing driver fields; use database-level cascade delete to avoid FK errors

## Constitution Check

- **Code Quality**: Keep form/table updates localized to driver management.
- **Mobile-First**: Ensure table and form layout remain responsive.
- **UX Consistency**: Use existing confirmation helper with Bootstrap styling when available.
- **Performance**: No material impact expected.

No exceptions anticipated.

## Project Structure

### Documentation (this feature)

```text
specs/004-driver-weight-delete/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── DriverManagement.js
│   └── utils/
│       └── helpers.js
```

**Structure Decision**: Web application under `frontend/`, with changes in DriverManagement and confirmation helper.

## Complexity Tracking

None.
