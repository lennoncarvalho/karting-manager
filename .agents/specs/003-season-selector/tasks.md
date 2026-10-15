---

description: "Task list for season selector persistence"
---

# Tasks: Season Selector Persistence

**Input**: Design documents from `/specs/003-season-selector/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 3: User Story 1 - Switch season from rankings page (Priority: P1)

**Goal**: Replace the PublicRankings season label with a selector and refresh rankings/accent color on change.

**Independent Test**: Change the season selector on PublicRankings and confirm rankings and accent color update.

### Implementation for User Story 1

- [x] T001 [US1] Identify or add a shared local storage key for selected season in `frontend/src/services/theme.js` (or relevant storage helper).
- [x] T002 [US1] Replace `#season-name` label with a `<select>` in `frontend/src/pages/PublicRankings.js`, populated with available seasons.
- [x] T003 [US1] Wire the PublicRankings selector change event to persist selection, reload rankings, reapply `applySeasonTheme`, and filter races by the selected season in `frontend/src/pages/PublicRankings.js`.
- [x] T007 [US1] Filter PublicRankings season options to available seasons only and handle the no-available-seasons state in `frontend/src/pages/PublicRankings.js`.

---

## Phase 4: User Story 2 - Persist selected season across pages (Priority: P2)

**Goal**: Ensure all season selectors default to the stored season when present.

**Independent Test**: Select a season on PublicRankings and confirm another page's season selector loads with that selection.

### Implementation for User Story 2

- [x] T004 [US2] Update existing season selector initialization to read the stored season ID and preselect it in relevant pages/components under `frontend/src/`.
- [x] T005 [US2] Maintain fallback to existing default-season logic when stored season is missing or invalid, without duplicating or conflicting season selection logic.
- [x] T008 [US2] Rename the season admin toggle to \"Available season\" while keeping the same stored field in `frontend/src/pages/SeasonManagement.js`.

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T006 [P] Spot-check season selection persistence by navigating between pages with selectors.
