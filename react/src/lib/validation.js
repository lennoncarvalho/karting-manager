// Form validation helpers.
//
// Most field-level validation is now done with native HTML5 constraints
// (`type="email"`, `type="color"`, `type="number"` with `min`/`step`,
// `min`/`max` on date inputs, `required`, `pattern`) plus `onInvalid` +
// `setCustomValidity` for i18n messages — see `DriverLoginPage.jsx` for the
// canonical pattern.
//
// The helpers below cover the only cases the platform can't express
// declaratively:
//   - cross-field date ranges
//   - the `m:ss.SSS` lap-time format (also validated outside `<input>`,
//     e.g. on OCR results in `OcrImportModal`)
//   - email — kept as defense-in-depth before hitting Supabase

export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidDateRange(startDate, endDate) {
  return new Date(endDate) >= new Date(startDate);
}

export function isValidCupDateRange(seasonStart, seasonEnd, cupStart, cupEnd) {
  const sS = new Date(seasonStart);
  const sE = new Date(seasonEnd);
  const cS = new Date(cupStart);
  const cE = new Date(cupEnd);
  return cS >= sS && cE <= sE && cE >= cS;
}

export function isValidLapTime(lapTime) {
  if (!lapTime || typeof lapTime !== "string") return false;
  return /^(\d{1,2}:)?\d{1,2}:\d{2}\.\d{1,3}$/.test(lapTime.trim());
}
