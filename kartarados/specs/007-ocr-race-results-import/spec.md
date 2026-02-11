# Feature Specification: OCR Race Results Import

**Feature Branch**: `007-ocr-race-results-import`  
**Created**: 2026-02-10  
**Status**: Draft  
**Input**: User description: "Add OCR import to the race results page for race and qualifying sheets (Portuguese), using a hybrid OCR approach: Tesseract.js in-browser by default with optional Azure Vision OCR when configured. Users must review and confirm parsed rows, resolve unmatched drivers, and enforce race results import before qualifying."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import race results from photo (Priority: P1)

As a race admin, I want to upload or take a photo of the race results sheet and import results automatically so I do not have to type each row manually.

**Why this priority**: This is the primary time-saver and the main value of OCR in the race results workflow.

**Independent Test**: Can be fully tested by importing a single race results sheet into an empty race and saving results.

**Acceptance Scenarios**:

1. **Given** I am on a race detail page with no results, **When** I upload a race results image, **Then** the app extracts position, driver name, and best lap time, shows a review list, and allows me to save the results.
2. **Given** the OCR output has a few names that do not match drivers, **When** I review the list, **Then** I can select a driver or skip rows before saving.
3. **Given** I confirm the import, **When** the save completes, **Then** the page reloads and shows the newly created race results.

---

### User Story 2 - Qualifying import updates starting grid (Priority: P1)

As a race admin, I want to import a qualifying sheet to update each driver's starting grid position after race results exist.

**Why this priority**: Qualifying data is required for the race results to be complete but should not allow duplicate race result creation.

**Independent Test**: Can be fully tested by importing race results first, then importing a qualifying sheet and verifying grid positions update.

**Acceptance Scenarios**:

1. **Given** race results already exist, **When** I import a qualifying sheet, **Then** the app updates `grid_start_position` for matched drivers and ignores other data.
2. **Given** no race results exist, **When** I try to import qualifying, **Then** the app blocks the action and explains that race results must be imported first.

---

### User Story 3 - Hybrid OCR provider selection (Priority: P2)

As a race admin, I want the app to use a cloud OCR provider when configured and fall back to in-browser OCR otherwise so the feature works on a static hosted site.

**Why this priority**: The app has no backend and needs a reliable OCR option that can still function without a cloud key.

**Independent Test**: Can be tested by removing the Azure config (use Tesseract.js) and then adding it (use Azure Vision).

**Acceptance Scenarios**:

1. **Given** Azure Document Intelligence keys are configured, **When** I import a sheet, **Then** the app uses Azure Document Intelligence by default and falls back to Tesseract.js on failure.
2. **Given** Azure Document Intelligence is not configured, **When** I import a sheet, **Then** the app uses Tesseract.js without prompting for a key.

---

### User Story 4 - Review and correction before save (Priority: P2)

As a race admin, I want to review OCR results and correct driver matches before saving so incorrect data does not enter the results table.

**Why this priority**: OCR is imperfect and must be correctable.

**Independent Test**: Can be tested by forcing mismatched names and confirming that the review UI resolves them before saving.

**Acceptance Scenarios**:

1. **Given** OCR suggests multiple drivers with similar names, **When** I review the list, **Then** I can pick the correct driver or skip the row.
2. **Given** I change any row in the review list, **When** I save, **Then** the saved results reflect the corrected matches.

---

### Edge Cases

- What happens when OCR returns no rows or only headers?
- How does the parser behave when the header text is partially missing and the sheet type is ambiguous?
- How are names with accent differences or extra spacing matched?
- What happens when a race already has some results and the user tries to import race results again?
- How are rows handled when best lap time is missing or malformed?
- How does the UI behave on slow devices when Tesseract.js OCR takes longer than expected?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Race detail MUST add an OCR import button next to existing "Add Result" controls.
- **FR-002**: OCR import MUST accept image upload and camera capture (`image/*`, mobile camera).
- **FR-003**: OCR import MUST support two modes: Race Results and Qualifying.
- **FR-004**: OCR import MUST auto-detect sheet type from header text (`"Corrida"` vs `"Tomada de Tempo"`); if detection conflicts with the selected mode, the user MUST confirm before continuing.
- **FR-005**: Race Results import MUST be blocked if the race already has results, to avoid duplicate `(race_id, driver_id)` entries.
- **FR-006**: Qualifying import MUST be blocked until at least one race result exists for the race.
- **FR-007**: OCR providers MUST be hybrid: default "Auto" uses Azure Document Intelligence if configured, otherwise Tesseract.js.
- **FR-008**: If Azure Document Intelligence fails (network, quota, error), the app MUST fallback to Tesseract.js and notify the user.
- **FR-009**: Tesseract.js MUST run with Portuguese language (`por`) and in-browser only (no backend dependency).
- **FR-010**: OCR parsing MUST extract:
  - Race Results: `finish_position`, `driver_name`, `best_lap_time` (from `TMV`)
  - Qualifying: `driver_name`, `grid_start_position` (from `POS`)
- **FR-011**: Parsed rows MUST be shown in a review list with:
  - Original OCR name
  - Parsed position/time
  - Matched driver (selectable)
  - Skip toggle
- **FR-012**: Driver matching MUST be fuzzy and accent-insensitive:
  - Normalize by removing diacritics, punctuation, and extra whitespace; compare case-insensitively.
  - Use a similarity threshold; ambiguous matches (two+ close candidates) MUST require manual selection.
- **FR-013**: Saving Race Results MUST create new race results with `finish_position` and `best_lap_time`; `grid_start_position` remains empty until qualifying import.
- **FR-014**: Saving Qualifying MUST update existing race results `grid_start_position` for matched drivers and ignore other fields.
- **FR-015**: Rows without a confirmed driver MUST be skipped; users can explicitly skip rows in the review list.
- **FR-016**: After a successful save, the Race Detail page MUST reload to show updated results.
- **FR-017**: OCR drafts MUST be kept in-memory or localStorage until saved/canceled and cleared afterward.
- **FR-018**: Config MUST add OCR settings in `frontend/src/config.js` and the build script MUST inject Azure values from environment variables (same approach as Supabase).
- **FR-019**: Bonus (post-MVP): capture kart number (`#`) if available and store it when the schema allows.

### Key Entities *(include if feature involves data)*

- **OCRImportSession**: Selected OCR provider, image metadata, detected sheet type, raw OCR output.
- **OCRImportRow**: Parsed `position`, `name_raw`, `best_lap_time`, `match_status`, `match_candidates`, `driver_id`, `skip`.
- **RaceResult**: Existing entity; used for creating results (race import) and updating `grid_start_position` (qualifying).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can import a typical 15-25 driver race sheet in under 5 minutes, including review and save.
- **SC-002**: At least 80% of rows auto-match drivers on the first pass for a typical Portuguese sheet.
- **SC-003**: No duplicate race results are created for the same `(race_id, driver_id)`; imports never violate unique constraints.
- **SC-004**: OCR import succeeds with Tesseract.js alone when Azure Vision keys are not configured.
