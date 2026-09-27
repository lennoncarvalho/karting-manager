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
  } catch {
    /* best-effort storage write; ignore quota/unavailable errors */
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

function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  return [1, 3, 5].map((i) => parseInt(m[1].slice(i - 1, i + 1), 16));
}

export function accentContrast(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return "#fff";
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb;
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.4 ? "#212529" : "#fff";
}

export function accentRgb(hex) {
  const rgb = parseHex(hex);
  return rgb ? rgb.join(", ") : null;
}
