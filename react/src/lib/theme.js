import { isValidHexColor } from "@/lib/validation";

const SELECTED_SEASON_KEY = "selectedSeasonId";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function applySeasonTheme(season) {
  if (season?.accent_color && isValidHexColor(season.accent_color)) {
    document.documentElement.style.setProperty(
      "--season-accent",
      season.accent_color,
    );
  }
}

export function getStoredSeasonId() {
  const stored = readStorage(SELECTED_SEASON_KEY);
  return stored ? String(stored) : null;
}

export function setStoredSeasonId(seasonId) {
  if (seasonId === undefined || seasonId === null) return;
  writeStorage(SELECTED_SEASON_KEY, String(seasonId));
}
