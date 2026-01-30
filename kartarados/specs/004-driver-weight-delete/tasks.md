---

description: "Task list for driver weight and cascade delete"
---

# Tasks: Driver Weight And Cascade Delete

**Input**: Design documents from `/specs/004-driver-weight-delete/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 3: User Story 1 - Capture driver weight (Priority: P1)

**Goal**: Add weight to the driver form and show it in the table.

**Independent Test**: Create/edit a driver with a weight and confirm the table displays it.

### Implementation for User Story 1

- [x] T001 [US1] Add numeric weight input to the driver form and persist it in `frontend/src/pages/DriverManagement.js`.
- [x] T002 [US1] Replace the email column with weight in the Existing Drivers table in `frontend/src/pages/DriverManagement.js`.
- [x] T003 [US1] Provide SQL to add the weight column in Supabase and document it in the spec notes or response.

---

## Phase 4: User Story 2 - Safer driver removal with cascade (Priority: P1)

**Goal**: Confirm deletion intent and ensure driver deletion cascades to race results.

**Independent Test**: Delete a driver with race results and confirm no FK errors occur.

### Implementation for User Story 2

- [x] T004 [US2] Update `showConfirmation` to use Bootstrap modal UI when available in `frontend/src/utils/helpers.js`.
- [x] T005 [US2] Update driver delete confirmation message to the provided text in `frontend/src/pages/DriverManagement.js`.
- [x] T006 [US2] Provide SQL to add cascade delete to `race_results.driver_id` foreign key (drop/recreate constraint) for Supabase.

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T007 [P] Spot-check driver create/edit/delete flows and table layout.
