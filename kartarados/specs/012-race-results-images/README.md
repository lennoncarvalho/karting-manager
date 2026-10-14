# Spec 012: OCR Image Archive + Race Images Carousel

**Status:** planned
**Base branch:** `resize-profile-picrture`
**Date:** 2026-10-11

## Goal

After an admin successfully imports race results via OCR, the source image is resized
to 1280px max and uploaded to a Supabase storage bucket for audit/source-verification.
A "View Source Images" button on the race detail page opens a Bootstrap carousel
showing all archived images for that race.

## Design Decisions

- No database table — images in storage are the audit trail.
- `resizeImage()` with `{ maxSize: 1280, quality: 0.85 }` for OCR archives.
- Both race and qualifying mode images are archived (same `handleSave` path in `OcrImportModal`).
- Image upload is best-effort, non-blocking after data save succeeds.
- Bootstrap 5.3 native carousel — already in the project, no new dependency.

## Prerequisites (manual, before code)

Create a Supabase storage bucket:

| Setting | Value |
|---|---|
| Name | `race-images` |
| Public bucket | yes |
| File size limit | 5 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| RLS: INSERT | authenticated users |
| RLS: SELECT | public / anon |

## Files Changed

| File | Change |
|---|---|
| `react/src/lib/api.js` | New `uploadRaceImage()` + `listRaceImages()` functions |
| `react/src/components/modals/OcrImportModal.jsx` | Upload image on successful save |
| `react/src/components/modals/RaceImagesCarousel.jsx` | New — Bootstrap carousel modal |
| `react/src/pages/RaceDetail.jsx` | "View Source Images" button + carousel wiring |
| `react/src/i18n/resources/en.json` | New i18n keys |
| `react/src/i18n/resources/pt-BR.json` | New i18n keys |

## Data Flow

```
OcrImportModal.handleSave()
  → await onSave({ mode, rows })     // saves race results to DB
  → if success && selectedFile:
       → uploadRaceImage(raceId, selectedFile)   // best-effort
            → resizeImage(file, { maxSize: 1280, quality: 0.85 })
            → supabase.storage.from("race-images").upload()

RaceDetail — "View Source Images" click
  → listRaceImages(raceId)
       → supabase.storage.from("race-images").list(raceId)
       → map each file → getPublicUrl()
  → <RaceImagesCarousel images={urls} />
```

## Edge Cases

| Scenario | Handling |
|---|---|
| Image upload fails after successful data save | Toast warning, results still saved |
| No file selected at save time | `selectedFile && raceId` guard skips upload |
| Race has no archived images | Carousel shows empty state |
| Single image archived | Carousel renders without prev/next arrows |
| Storage listing fails | `listRaceImages` returns `[]`, handled by empty state |

## Verification

1. `cd react && npm run build` — passes
2. Create `race-images` Supabase bucket (see Prerequisites)
3. Import **race** results via OCR → storage has `{raceId}/{timestamp}.jpg`
4. Verify uploaded image ≤1280px max dimension, JPEG format
5. Import **qualifying** results via OCR → same bucket, same pattern
6. Click "View Source Images" → carousel loads image(s)
7. Empty state: race with no images shows "No source images" message
8. Multiple images: prev/next navigation works
9. Close button dismisses modal