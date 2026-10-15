---

description: "Task list for OCR race results import"
---

# Tasks: OCR Race Results Import

**Input**: Design documents from `/specs/007-ocr-race-results-import/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - Import race results from photo (Priority: P1)

**Goal**: Import race results from a photo, review parsed rows, and create results.

**Independent Test**: Upload a race results photo for a race without results and save the parsed data.

### Implementation for User Story 1

- [ ] T001 [US1] Add an OCR import button near the existing action buttons in `frontend/src/pages/RaceDetail.js` that launches the OCR flow.
- [ ] T002 [US1] Create a new modal UI for OCR import, including image input (upload/camera), mode selection (race/qualifying), preview, and progress indicators in `frontend/src/components/OcrImportModal.js`.
- [ ] T003 [US1] Implement OCR text extraction and parsing pipeline in `frontend/src/services/ocr.js` and `frontend/src/utils/parsing.js`, handling Portuguese headers and table rows for race results (`POS`, `Nome`, `TMV`).
- [ ] T004 [US1] Build review list UI with per-row driver selection, skip toggle, and editable values in `frontend/src/components/OcrImportModal.js`.
- [ ] T005 [US1] Wire save flow to create race results using existing API helpers in `frontend/src/pages/RaceDetail.js`, block when results already exist, and reload the page after save.
- [ ] T006 [US1] Add i18n keys for OCR import UI in `frontend/src/translations/en.json` and `frontend/src/translations/pt-BR.json`.

---

## Phase 2: User Story 2 - Qualifying import updates starting grid (Priority: P1)

**Goal**: Update grid start positions from qualifying after race results exist.

**Independent Test**: Import race results, then import a qualifying sheet and verify grid positions update.

### Implementation for User Story 2

- [ ] T007 [US2] Enforce gating in `frontend/src/pages/RaceDetail.js` and `frontend/src/components/OcrImportModal.js` so qualifying import is blocked until results exist.
- [ ] T008 [US2] Extend parsing in `frontend/src/utils/parsing.js` to extract qualifying positions and driver names from `Tomada de Tempo` sheets.
- [ ] T009 [US2] Update existing race results with `grid_start_position` for matched drivers using `frontend/src/services/api.js`, skipping unmatched rows.

---

## Phase 3: User Story 3 - Hybrid OCR provider selection (Priority: P2)

**Goal**: Use Azure Document Intelligence when configured and fall back to Tesseract.js otherwise.

**Independent Test**: Run OCR without Azure config (Tesseract.js), then with Azure config (Azure Document Intelligence).

### Implementation for User Story 3

- [ ] T010 [US3] Add Azure Document Intelligence configuration values to `frontend/src/config.js` and inject them via `build.sh` environment variables (same pattern as Supabase).
- [ ] T011 [US3] Implement provider selection and fallback logic in `frontend/src/services/ocr.js` (Auto -> Azure Document Intelligence if configured, else Tesseract.js).

---

## Phase 4: User Story 4 - Review and correction before save (Priority: P2)

**Goal**: Ensure users can resolve mismatches and skip rows before saving.

**Independent Test**: Force mismatched names and verify review UI requires resolution or skip.

### Implementation for User Story 4

- [ ] T012 [US4] Add fuzzy driver matching utilities (accent-insensitive normalization + similarity scoring) in `frontend/src/utils/matching.js`.
- [ ] T013 [US4] Highlight ambiguous/failed matches and require manual selection before saving in `frontend/src/components/OcrImportModal.js`.
- [ ] T014 [US4] Store OCR draft state in memory or localStorage and clear it after cancel/save in `frontend/src/components/OcrImportModal.js`.
