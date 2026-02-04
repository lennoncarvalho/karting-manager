---

description: "Task list for Public Rankings calendar tab"
---

# Tasks: Public Rankings Calendar Tab

**Input**: Design documents from `/specs/006-public-rankings-calendar/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 3: User Story 1 - Penalties tab last (Priority: P1)

**Goal**: Reorder tabs so Penalties is always last.

**Independent Test**: Load Public Rankings and verify the Penalties tab appears last.

### Implementation for User Story 1

- [ ] T001 [US1] Reorder the tab sections so Penalties renders last in `frontend/src/pages/PublicRankings.js`.

---

## Phase 4: User Story 2 - Calendar tab for season races (Priority: P1)

**Goal**: Add a Calendar tab that lists all season races with winner and fastest lap details.

**Independent Test**: Select a season and verify the Calendar tab is the default active tab showing all races in ascending date order with winner/fastest lap driver info when results exist.

### Implementation for User Story 2

- [ ] T002 [US2] Add a Calendar section definition (tab id/label) as the first tab and default active tab in `frontend/src/pages/PublicRankings.js`.
- [ ] T003 [US2] Build Calendar table rows from `listRaces` and `listRaceResultsByRaceIds`, sorting by `race_datetime` and mapping winner/fastest lap driver picture + name in `frontend/src/pages/PublicRankings.js`.
- [ ] T004 [US2] Use `parseLapTime` from `frontend/src/services/points.js` (or an equivalent helper) to determine the fastest lap driver/time in `frontend/src/pages/PublicRankings.js`.

---

## Phase 5: User Story 3 - Localized, mobile-friendly calendar (Priority: P2)

**Goal**: Ensure calendar labels are localized and the table remains responsive.

**Independent Test**: Switch locale and view the Calendar tab on mobile widths; labels translate and table remains usable.

### Implementation for User Story 3

- [ ] T005 [US3] Add i18n keys for Calendar tab label and table headers in `frontend/src/translations/en.json` and `frontend/src/translations/pt-BR.json`.
- [ ] T006 [US3] Ensure Calendar rendering uses the existing responsive table wrapper in `frontend/src/pages/PublicRankings.js`.
