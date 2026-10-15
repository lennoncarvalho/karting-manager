function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function levenshteinDistance(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return Math.max(left.length, right.length);
  const matrix = Array.from({ length: left.length + 1 }, () => []);
  for (let i = 0; i <= left.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[left.length][right.length];
}

function similarityScore(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const distance = levenshteinDistance(left, right);
  const maxLen = Math.max(left.length, right.length) || 1;
  return Math.max(0, 1 - distance / maxLen);
}

export function matchDriverName(name, drivers, options = {}) {
  const {
    minCandidateScore = 0.65,
    autoMatchScore = 0.85,
    minScoreGap = 0.1,
  } = options;
  const normalized = normalizeText(name);
  if (!normalized) return { best: null, candidates: [], normalized };
  const scored = drivers
    .map((driver) => ({
      driver,
      score: similarityScore(normalized, driver.name),
    }))
    .filter((item) => item.score >= minCandidateScore)
    .sort((a, b) => b.score - a.score);

  const best = scored[0] || null;
  const second = scored[1] || null;
  const autoMatch =
    best &&
    (!second || best.score - second.score >= minScoreGap) &&
    best.score >= autoMatchScore;

  return {
    best: autoMatch ? best.driver : null,
    candidates: scored.map((item) => item.driver),
    normalized,
  };
}

export { normalizeText };
