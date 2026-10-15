# Feature Specification: Driver Weight And Cascade Delete

**Feature Branch**: `004-driver-weight-delete`  
**Created**: 2026-01-29  
**Status**: Done  
**Input**: User description: "Drivers form should have a weight numeric field. Show me the necessary SQL to run on Supabase in order to create the column. On the \"Existing Drivers\" table #driver-table-body, remove the email column and add one for the weight. On the same table in the Actions column, when users click the Edit button, a nice(preferably all Bootstrap) confirmation dialog should appear. The confirmation dialog will say: \"Are you sure you want to exclude this driver and all his race results? This cannot be undone.\" The user will have the option to proceed with deletion or cancel. Driver deletion is not working, this is the error returned: Key is still referenced from table \"race_results\". Search for a way to have a cascade delete on Supabase, even if we need a policy or other trick. Once the user confirms, we need to delete the driver and all its references."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture driver weight (Priority: P1)

As an admin managing drivers, I want to record driver weight so it can be stored and displayed in the drivers table.

**Why this priority**: The driver record needs the new field for upcoming features and reporting.

**Independent Test**: Create or edit a driver with a weight value and verify it displays in the table.

**Acceptance Scenarios**:

1. **Given** I create a driver with a weight value, **When** the driver is saved, **Then** the value is stored and shown in the Existing Drivers table.
2. **Given** a driver already exists, **When** I edit and update the weight, **Then** the table shows the updated weight.

---

### User Story 2 - Safer driver removal with cascade (Priority: P1)

As an admin, I want to confirm removal of a driver and ensure all related race results are removed so the operation succeeds cleanly.

**Why this priority**: Driver deletion currently fails due to foreign key constraints.

**Independent Test**: Delete a driver with race results and confirm both the driver and their race results are removed.

**Acceptance Scenarios**:

1. **Given** a driver has race results, **When** I confirm removal, **Then** the driver and all related race results are deleted without errors.
2. **Given** I cancel the confirmation dialog, **When** I return to the table, **Then** no deletion occurs.

---

### Edge Cases

- What happens when weight is left empty?
- How should the table show missing weight values?
- What happens when a driver has no race results?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Driver form MUST include a numeric weight input field and persist it to the driver record.
- **FR-002**: Existing Drivers table MUST display weight and MUST NOT display email.
- **FR-003**: Driver deletion MUST be confirmed with the provided message before removal proceeds.
- **FR-004**: Driver deletion MUST remove related race results via cascade delete (database constraint or equivalent).
- **FR-005**: Confirmation dialog MUST use Bootstrap styling when available.

### Key Entities *(include if feature involves data)*

- **Driver**: Includes weight field in addition to existing attributes.
- **RaceResult**: References drivers and must be deleted when a driver is removed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drivers can be created/updated with weight and the value appears in the table.
- **SC-002**: Deleting a driver with race results succeeds without foreign key errors.
- **SC-003**: Confirmation dialog is shown before deletion and can be canceled.
