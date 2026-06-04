/**
 * Pure value-level validators shared across feature forms. Ported
 * verbatim from v1 `frontend/src/utils/validation.js` (the predicates
 * we still use). Keep these dependency-free so they can be reused
 * inside Angular components, services, and pure unit tests alike.
 */

/** True for a non-empty value (strings are trimmed). */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/** True when the value parses to a strictly positive integer. */
export function isPositiveInteger(value: unknown): boolean {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
}

/** Match `MM:SS.mmm` or `HH:MM:SS.mmm`. Empty/non-string is invalid. */
export function isValidLapTime(value: unknown): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^(\d{1,2}:)?\d{1,2}:\d{2}\.\d{1,3}$/.test(value.trim());
}
