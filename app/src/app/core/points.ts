/**
 * Points / Ranking engine — ported from `frontend/src/services/points.js`.
 *
 * BUSINESS RULES (see spec 010 §6.7 — canonical)
 * - Position 1..24 awards 35..1 points (see `POSITION_POINTS` below).
 * - Pole position (`grid_start_position === 1`) awards **+1 bonus**.
 * - Fastest lap (lowest parsed `best_lap_time` among the race results)
 *   awards **+1 bonus**. Tie-breaker: better `finish_position`.
 * - Penalty rows are summed via `point_deduction * count`. Negative or
 *   zero only.
 * - `race_direction_warning` penalty points accumulate; ≥20 sets the
 *   driver's `suspended` flag (calculated only — no UI surfacing yet).
 * - Discard logic (§ getDiscardCount):
 *     • `options.discardCount` if explicitly provided (>= 0)
 *     • `options.type === 'cup'`     → 1 discard when races > 1
 *     • `options.type === 'overall'` → discard count == number of cups in input
 *     • Otherwise → same rule, with a fallback for single-cup seasons
 *       (1 discard when races > 1 and exactly one cup).
 * - Discarded races contribute only their penalties (never their base
 *   points) to the season total. The discarded race(s) are picked by
 *   lowest base points first (then earliest race index).
 * - Tie-breakers for overall ranking: total points → most 1st places,
 *   2nd, … 24th → poles → fastest laps → fewer penalties → earliest
 *   race in which the driver reached their final total.
 */

import type { Race, RaceResult } from './models';

const POSITION_POINTS: Record<number, number> = {
  1: 35, 2: 30, 3: 26, 4: 23, 5: 21, 6: 19,
  7: 18, 8: 17, 9: 16, 10: 15, 11: 14, 12: 13,
  13: 12, 14: 11, 15: 10, 16: 9, 17: 8, 18: 7,
  19: 6, 20: 5, 21: 4, 22: 3, 23: 2, 24: 1,
};

export function getPositionPoints(position: number | null | undefined): number {
  if (position == null) return 0;
  return POSITION_POINTS[position] ?? 0;
}

/**
 * Parse a `MM:SS.mmm` or `HH:MM:SS.mmm` lap time into milliseconds.
 * Returns `null` if the input is invalid.
 */
export function parseLapTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const parts = value.split(':');
  let hours = 0;
  let minutes = 0;
  let secondsPart = '';

  if (parts.length === 3) {
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
    secondsPart = parts[2];
  } else if (parts.length === 2) {
    minutes = Number(parts[0]);
    secondsPart = parts[1];
  } else {
    return null;
  }

  const [secondsStr, millisStr = '0'] = secondsPart.split('.');
  const seconds = Number(secondsStr);
  const millis = Number(millisStr.padEnd(3, '0'));

  if ([hours, minutes, seconds, millis].some(Number.isNaN)) return null;
  return (((hours * 60) + minutes) * 60 + seconds) * 1000 + millis;
}

function getFastestLapWinner(results: RaceResult[]): string | null {
  let best: { id: string; time: number; finish: number } | null = null;
  for (const result of results) {
    const time = parseLapTime(result.best_lap_time);
    if (time === null) continue;
    if (!best || time < best.time) {
      best = { id: result.driver_id, time, finish: result.finish_position };
    } else if (time === best.time && result.finish_position < best.finish) {
      best = { id: result.driver_id, time, finish: result.finish_position };
    }
  }
  return best ? best.id : null;
}

function getPoleWinner(results: RaceResult[]): string | null {
  const pole = results.find((r) => r.grid_start_position === 1);
  return pole ? pole.driver_id : null;
}

export type RankingType = 'cup' | 'overall' | 'season';

export interface RankingOptions {
  type?: RankingType;
  /** If provided, overrides the type-based formula (>= 0). */
  discardCount?: number;
}

function getDiscardCount(races: Race[], options: RankingOptions = {}): number {
  if (Number.isFinite(options.discardCount as number)) {
    return Math.max(0, Math.floor(options.discardCount as number));
  }
  if (options.type === 'cup') {
    return races.length > 1 ? 1 : 0;
  }
  if (options.type === 'overall') {
    const cupIds = new Set<string>();
    for (const race of races) if (race.cup_id != null) cupIds.add(String(race.cup_id));
    return cupIds.size;
  }
  // Default "season" behaviour, matches v1 fallback:
  const cupIds = new Set<string>();
  for (const race of races) if (race.cup_id != null) cupIds.add(String(race.cup_id));
  if (cupIds.size === 1 && races.length > 1) return 1;
  return cupIds.size;
}

function getDiscardIndices(basePoints: number[], discardCount: number): Set<number> {
  if (!discardCount) return new Set();
  const count = Math.min(discardCount, basePoints.length);
  const sorted = basePoints
    .map((points, index) => ({ points, index }))
    .sort((a, b) => (a.points - b.points) || (a.index - b.index));
  return new Set(sorted.slice(0, count).map((e) => e.index));
}

export interface RankingEntry {
  rank: number;
  driverId: string;
  name: string;
  picture: string | null;
  totalPoints: number;
  bestPosition: number | null;
  positionCounts: Record<number, number>;
  poles: number;
  fastestLaps: number;
  penalties: number;
  firstPenaltyAt: number | null;
  firstPenaltyFinish: number | null;
  reachedAt: number;
  racePoints: number[];
  disqualifiedCount: number;
  raceDirectionPenaltyPoints: number;
  suspended: boolean;
}

/**
 * Compute the championship-style ranking for a set of races + results.
 * Mirrors `calculateRankings` from v1 line-for-line.
 */
export function calculateRankings(
  races: Race[],
  raceResults: RaceResult[],
  options: RankingOptions = {},
): RankingEntry[] {
  const orderedRaces = [...races].sort(
    (a, b) => new Date(a.race_datetime).getTime() - new Date(b.race_datetime).getTime(),
  );

  const resultsByRace = new Map<string, RaceResult[]>();
  for (const result of raceResults) {
    const arr = resultsByRace.get(result.race_id);
    if (arr) arr.push(result);
    else resultsByRace.set(result.race_id, [result]);
  }

  type Stats = Omit<RankingEntry, 'rank'>;
  const driverStats = new Map<string, Stats>();
  const driverRacePoints = new Map<string, { basePoints: number[]; penalties: number[] }>();
  const discardCount = getDiscardCount(orderedRaces, options);

  orderedRaces.forEach((race, raceIndex) => {
    const results = resultsByRace.get(race.id) ?? [];
    if (!results.length) return;

    const fastestLapWinner = getFastestLapWinner(results);
    const poleWinner = getPoleWinner(results);

    for (const result of results) {
      const driverId = result.driver_id;
      if (!driverStats.has(driverId)) {
        driverStats.set(driverId, {
          driverId,
          name: result.drivers ? result.drivers.name : 'Unknown',
          picture: result.drivers ? result.drivers.picture_url ?? null : null,
          totalPoints: 0,
          bestPosition: result.finish_position || null,
          positionCounts: {},
          poles: 0,
          fastestLaps: 0,
          penalties: 0,
          firstPenaltyAt: null,
          firstPenaltyFinish: null,
          reachedAt: Number.MAX_SAFE_INTEGER,
          racePoints: [],
          disqualifiedCount: 0,
          raceDirectionPenaltyPoints: 0,
          suspended: false,
        });
      }
      if (!driverRacePoints.has(driverId)) {
        driverRacePoints.set(driverId, {
          basePoints: new Array(orderedRaces.length).fill(0),
          penalties: new Array(orderedRaces.length).fill(0),
        });
      }

      const stats = driverStats.get(driverId)!;
      const finishPosition = result.finish_position;
      const basePoints = getPositionPoints(finishPosition);
      const penaltiesTotal = (result.penalties ?? []).reduce((sum, p) => {
        const count = Number(p.count || 0);
        const points = Number(p.point_deduction || 0);
        if (p.penalty_type === 'race_direction_warning') {
          stats.raceDirectionPenaltyPoints += points * count;
        }
        return sum + points * count;
      }, 0);

      if (penaltiesTotal !== 0 && race.race_datetime) {
        const penaltyTime = new Date(race.race_datetime).getTime();
        if (stats.firstPenaltyAt === null || penaltyTime < stats.firstPenaltyAt) {
          stats.firstPenaltyAt = penaltyTime;
          stats.firstPenaltyFinish = finishPosition || null;
        }
      }

      const ledger = driverRacePoints.get(driverId)!;
      ledger.basePoints[raceIndex] += basePoints;
      if (poleWinner === driverId) ledger.basePoints[raceIndex] += 1;
      if (fastestLapWinner === driverId) ledger.basePoints[raceIndex] += 1;
      ledger.penalties[raceIndex] += penaltiesTotal;

      if (finishPosition) {
        stats.bestPosition = stats.bestPosition
          ? Math.min(stats.bestPosition, finishPosition)
          : finishPosition;
        stats.positionCounts[finishPosition] = (stats.positionCounts[finishPosition] || 0) + 1;
      }
      if (poleWinner === driverId) stats.poles += 1;
      if (fastestLapWinner === driverId) stats.fastestLaps += 1;
      stats.penalties += penaltiesTotal;
      if (result.is_disqualified) stats.disqualifiedCount += 1;
      if (stats.raceDirectionPenaltyPoints <= -20) stats.suspended = true;
    }
  });

  const rankings: Stats[] = Array.from(driverStats.values());

  for (const entry of rankings) {
    const ledger = driverRacePoints.get(entry.driverId) ?? {
      basePoints: new Array(orderedRaces.length).fill(0),
      penalties: new Array(orderedRaces.length).fill(0),
    };
    const discardIndices = getDiscardIndices(ledger.basePoints, discardCount);
    entry.racePoints = ledger.basePoints.map((base, index) => {
      const pen = ledger.penalties[index] || 0;
      return discardIndices.has(index) ? pen : base + pen;
    });
    const totalPoints = entry.racePoints.reduce((sum, v) => sum + v, 0);
    entry.totalPoints = totalPoints;

    let cumulative = 0;
    let reachedAt: number | null = null;
    orderedRaces.forEach((_race, index) => {
      cumulative += entry.racePoints[index] || 0;
      if (reachedAt === null && cumulative >= totalPoints) reachedAt = index;
    });
    entry.reachedAt = reachedAt === null ? Number.MAX_SAFE_INTEGER : reachedAt;
  }

  rankings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    for (let pos = 1; pos <= 24; pos += 1) {
      const diff = (b.positionCounts[pos] || 0) - (a.positionCounts[pos] || 0);
      if (diff !== 0) return diff;
    }
    if (b.poles !== a.poles) return b.poles - a.poles;
    if (b.fastestLaps !== a.fastestLaps) return b.fastestLaps - a.fastestLaps;
    if (a.penalties !== b.penalties) return b.penalties - a.penalties;
    if (a.reachedAt !== b.reachedAt) return a.reachedAt - b.reachedAt;
    return 0;
  });

  return rankings.map((entry, index) => ({ rank: index + 1, ...entry }));
}

/**
 * Penalty ranking — same data, re-sorted: most penalty points (i.e.
 * smallest negative), then earliest first penalty, then worst finish.
 */
export function calculatePenaltyRankings(
  races: Race[],
  raceResults: RaceResult[],
  options: RankingOptions = {},
): RankingEntry[] {
  const rankings = calculateRankings(races, raceResults, options);
  rankings.sort((a, b) => {
    const aP = a.penalties || 0;
    const bP = b.penalties || 0;
    if (aP !== bP) return aP - bP;
    const aFirst = a.firstPenaltyAt ?? Number.MAX_SAFE_INTEGER;
    const bFirst = b.firstPenaltyAt ?? Number.MAX_SAFE_INTEGER;
    if (aFirst !== bFirst) return aFirst - bFirst;
    const aFin = a.firstPenaltyFinish ?? Number.MAX_SAFE_INTEGER;
    const bFin = b.firstPenaltyFinish ?? Number.MAX_SAFE_INTEGER;
    if (aFin !== bFin) return bFin - aFin;
    return 0;
  });
  return rankings.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Sum penalty points (mirrors v1 calculatePenaltyPoints). */
export function calculatePenaltyPoints(
  penalties: Array<Pick<NonNullable<RaceResult['penalties']>[number], 'count' | 'point_deduction'>> = [],
): number {
  return penalties.reduce((total, p) => {
    const count = Number(p.count || 0);
    const points = Number(p.point_deduction || 0);
    return total + points * count;
  }, 0);
}
