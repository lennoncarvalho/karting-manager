/**
 * Driver name matching helpers — port of v1 `frontend/src/utils/matching.js`.
 *
 * Accent-insensitive, fuzzy Levenshtein-based matching. Used by the OCR
 * import flow to suggest a `Driver` for each parsed row.
 */

import type { Driver } from './models';

/** Strip diacritics, punctuation, collapse whitespace, lowercase. */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function levenshteinDistance(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return Math.max(left.length, right.length);
  const matrix: number[][] = Array.from({ length: left.length + 1 }, () => []);
  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
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

/** [0..1] similarity (1 = identical after normalisation). */
export function similarityScore(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const distance = levenshteinDistance(left, right);
  const maxLen = Math.max(left.length, right.length) || 1;
  return Math.max(0, 1 - distance / maxLen);
}

export interface MatchOptions {
  minCandidateScore?: number;
  autoMatchScore?: number;
  minScoreGap?: number;
}

export interface MatchResult {
  best: Driver | null;
  candidates: Driver[];
  normalized: string;
}

/**
 * Returns the best auto-match (only if its score is high enough and clearly
 * better than the runner-up) plus the sorted candidate list.
 */
export function matchDriverName(
  name: string,
  drivers: Driver[],
  options: MatchOptions = {},
): MatchResult {
  const {
    minCandidateScore = 0.65,
    autoMatchScore = 0.85,
    minScoreGap = 0.1,
  } = options;
  const normalized = normalizeText(name);
  if (!normalized) return { best: null, candidates: [], normalized };

  const scored = drivers
    .map((driver) => ({ driver, score: similarityScore(normalized, driver.name) }))
    .filter((item) => item.score >= minCandidateScore)
    .sort((a, b) => b.score - a.score);

  const best = scored[0] ?? null;
  const second = scored[1] ?? null;
  const autoMatch =
    best && (!second || best.score - second.score >= minScoreGap) && best.score >= autoMatchScore;

  return {
    best: autoMatch ? best.driver : null,
    candidates: scored.map((item) => item.driver),
    normalized,
  };
}
