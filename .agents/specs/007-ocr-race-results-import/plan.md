# Implementation Plan: OCR Race Results Import

**Branch**: `007-ocr-race-results-import` | **Date**: 2026-02-10 | **Spec**: `specs/007-ocr-race-results-import/spec.md`
**Input**: Feature specification from `/specs/007-ocr-race-results-import/spec.md`

## Summary

Add an OCR import flow to the Race Detail page that accepts a photo or upload, parses Portuguese race/qualifying sheets, and lets admins review and correct rows before saving. Use a hybrid OCR provider strategy: Azure Document Intelligence when configured, otherwise in-browser Tesseract.js, with automatic fallback on failures. Enforce race results import before qualifying, prevent duplicate race results, and reload the page after successful save.

## Technical Context

**Language/Version**: JavaScript (ES modules)  
**Primary Dependencies**: Browser DOM APIs, Bootstrap (UI), Supabase client (data)  
**OCR**: Azure Document Intelligence (Layout model via REST) + Tesseract.js (in-browser, Portuguese language)  
**Storage**: LocalStorage for draft OCR session (optional), Supabase tables for results  
**Testing**: Manual UI testing with sample images (no test harness identified)  
**Target Platform**: Web browser  
**Project Type**: Web  
**Constraints**: No backend; OCR requests must be client-side; unique `(race_id, driver_id)` constraint prevents duplicate results; OCR text is Portuguese.

## Constitution Check

- **No Backend**: OCR and parsing remain client-side; Azure key comes from build-time config.
- **Data Integrity**: Block race results import if any results exist; qualifying only updates grid positions.
- **UX Consistency**: Use existing modal and notification patterns from the Race Detail page.
- **Resilience**: Fall back to Tesseract.js if Azure OCR fails.

No exceptions anticipated.

## Project Structure

### Documentation (this feature)

```text
specs/007-ocr-race-results-import/
|-- plan.md
|-- spec.md
`-- tasks.md
```

### Source Code (repository root)

```text
frontend/
|-- src/
|   |-- components/
|   |   `-- OcrImportModal.js (new)
|   |-- pages/
|   |   `-- RaceDetail.js
|   |-- services/
|   |   `-- ocr.js (new)
|   |-- utils/
|   |   |-- matching.js (new)
|   |   `-- parsing.js (new)
|   `-- translations/
|       |-- en.json
|       `-- pt-BR.json
|-- src/config.js
`-- build.sh
```

**Structure Decision**: Keep OCR UI in a dedicated component, with provider logic and parsing utilities separated for clarity and reuse.

## Complexity Tracking

- Parsing printed tables from OCR text is heuristic and may require iteration on real samples.
- Fuzzy matching must balance false positives vs user corrections.
