export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidHexColor(color) {
  if (!color || typeof color !== "string") return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color.trim());
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

export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function isPositiveInteger(value) {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0;
}

export function isValidLapTime(lapTime) {
  if (!lapTime || typeof lapTime !== "string") return false;
  return /^(\d{1,2}:)?\d{1,2}:\d{2}\.\d{1,3}$/.test(lapTime.trim());
}
