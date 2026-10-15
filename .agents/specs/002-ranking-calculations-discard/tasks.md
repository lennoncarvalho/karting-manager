---

description: "Task list for ranking calculations with discards"
---

# Tasks: Ranking Calculations With Discards

**Input**: Design documents from `/specs/002-ranking-calculations-discard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 3: User Story 1 - Cup rankings discard worst/missed result (Priority: P1) 

**Goal**: Ensure each cup tab discards one worst or missed race per driver, skipping discard for single-race cups.

**Independent Test**: Calculate rankings for a single cup with known results and confirm one discard per driver (or none for one-race cups).

### Implementation for User Story 1

- [x] T001 [US1] Build a per-driver race ledger keyed by race ID, including 0-point placeholders for missing races, in `frontend/src/services/points.js`.
- [x] T002 [US1] Apply a single discard per driver to cup totals (skip if cup has one race) while keeping penalty deductions applied, in `frontend/src/services/points.js`.

---

## Phase 4: User Story 2 - Overall championship applies one discard per cup (Priority: P2)

**Goal**: Overall standings discard one race per cup across championship races, excluding races without `cup_id` from the discard count.

**Independent Test**: Calculate overall standings for a season with 2 cups and confirm two worst races are discarded per driver, while cup-less races do not add to discard count.

### Implementation for User Story 2

- [x] T003 [US2] Determine the overall discard count from distinct non-null cup IDs in the section races in `frontend/src/services/points.js`.
- [x] T004 [US2] Apply multi-discard logic for overall standings using the computed discard count, while honoring missing-race placeholders, in `frontend/src/services/points.js`.
- [x] T005 [US2] Update `frontend/src/pages/PublicRankings.js` if `calculateRankings` needs additional context or options for overall vs cup tabs.

---

## Phase 5: User Story 3 - Points reflect finishes and penalties only (Priority: P3)

**Goal**: Points are derived from finish position and penalties only, without pole/fastest bonuses.

**Independent Test**: Calculate a race where a driver has pole/fastest lap and verify points do not change while penalties still deduct.

### Implementation for User Story 3

- [x] T006 [US3] Remove pole and fastest lap bonus points from race totals while retaining counts for tie-breakers in `frontend/src/services/points.js`.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T007 [P] Spot-check cup and overall totals in the UI with sample data on `frontend/src/pages/PublicRankings.js`.
