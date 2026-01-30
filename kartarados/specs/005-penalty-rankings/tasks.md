---

description: "Task list for penalty rankings tab"
---

# Tasks: Penalty Rankings Tab

**Input**: Design documents from `/specs/005-penalty-rankings/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 3: User Story 1 - Penalty rankings tab (Priority: P1)

**Goal**: Add a penalties tab with correct sorting logic and tie-breakers.

**Independent Test**: Open the penalties tab and verify ordering by penalties, earliest penalty date, then worse finish position.

### Implementation for User Story 1

- [x] T001 [US1] Extend ranking aggregation to track penalty timing and finish position for tie-breaks in `frontend/src/services/points.js`.
- [x] T002 [US1] Add penalty-specific ranking sorter in `frontend/src/services/points.js`.
- [x] T003 [US1] Add Penalties tab on PublicRankings using the new penalty ranking logic in `frontend/src/pages/PublicRankings.js`.

---

## Phase 4: User Story 2 - Show penalties column in rankings (Priority: P1)

**Goal**: Display penalties in all ranking tables and keep Total Points after Driver.

**Independent Test**: Verify overall, cup, and penalties tabs show Total Points immediately after Driver with a penalties column present.

### Implementation for User Story 2

- [x] T004 [US2] Update rankings table headers/order to place Total Points after Driver and add penalties column in `frontend/src/pages/PublicRankings.js`.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T005 [P] Spot-check the rankings tabs and table layout on mobile.
