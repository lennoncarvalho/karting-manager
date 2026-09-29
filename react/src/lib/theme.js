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

function relativeLuminance([r, g, b]) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(a, b) {
  const [hi, lo] = [a, b].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function accentContrast(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return "#fff";
  const accent = relativeLuminance(rgb);
  const candidates = [
    ["#fff", 1],
    ["#212529", relativeLuminance([33, 37, 41])],
    ["#000", 0],
  ];
  return candidates
    .map(([color, luminance]) => [color, contrastRatio(accent, luminance)])
    .sort((a, b) => b[1] - a[1])[0][0];
}

export function accentRgb(hex) {
  const rgb = parseHex(hex);
  return rgb ? rgb.join(", ") : null;
}
