/**
 * Points Calculation Service
 * Computes driver rankings with tie-breakers
 */

const pointsTable = {
  1: 35, 2: 30, 3: 26, 4: 23, 5: 21, 6: 19,
  7: 18, 8: 17, 9: 16, 10: 15, 11: 14, 12: 13,
  13: 12, 14: 11, 15: 10, 16: 9, 17: 8, 18: 7,
  19: 6, 20: 5, 21: 4, 22: 3, 23: 2, 24: 1
};

export function getPositionPoints(position) {
  return pointsTable[position] || 0;
}

export function parseLapTime(value) {
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
  
  if ([hours, minutes, seconds, millis].some(Number.isNaN)) {
    return null;
  }
  
  return (((hours * 60) + minutes) * 60 + seconds) * 1000 + millis;
}

function getFastestLapWinner(results) {
  let best = null;
  results.forEach((result) => {
    const time = parseLapTime(result.best_lap_time);
    if (time === null) return;
    if (!best || time < best.time) {
      best = { id: result.driver_id, time, finish: result.finish_position };
      return;
    }
    if (time === best.time && result.finish_position < best.finish) {
      best = { id: result.driver_id, time, finish: result.finish_position };
    }
  });
  return best ? best.id : null;
}

function getPoleWinner(results) {
  const pole = results.find(result => result.grid_start_position === 1);
  return pole ? pole.driver_id : null;
}

// Sentinel finish position for "no-show" (no race_results row for the driver
// for a counting race). Worse than any real finish position so it wins the
// "worst result by finishing position" comparison used for discards.
const NO_SHOW_FINISH = Number.MAX_SAFE_INTEGER;

// Returns, for each cup_id present in `ordered`, the index of the worst race
// for the given driver inside that cup — but only if the cup's last race
// (by race_datetime) is in the past relative to `now`. Worst is computed by
// finishing position (higher = worse, no-show = NO_SHOW_FINISH).
function pickDiscardsByCup(ordered, finishByRace, driverId, now) {
  // Group race indices by cup_id; only races with cup_id participate (rule:
  // "one discard per cup for races that count to the ranking").
  const byCup = new Map();
  ordered.forEach((race, ri) => {
    if (race.cup_id == null) return;
    if (!byCup.has(race.cup_id)) {
      byCup.set(race.cup_id, { name: race.cup_name || null, races: [] });
    }
    byCup.get(race.cup_id).races.push({ ri, race });
  });
  const discards = [];
  byCup.forEach((cup, cupId) => {
    if (cup.races.length < 2) return; // need at least 2 races to drop one
    // Trigger only starting on the date of the last race of the cup.
    const lastDt = cup.races.reduce((max, { race }) => {
      const t = race.race_datetime ? new Date(race.race_datetime).getTime() : -Infinity;
      return t > max ? t : max;
    }, -Infinity);
    if (!Number.isFinite(lastDt) || now < lastDt) return;
    // Worst by finish_position; no-show counts as worst.
    let worst = null;
    cup.races.forEach(({ ri, race }) => {
      const map = finishByRace.get(race.id);
      const finish = (map && map.get(driverId) != null) ? map.get(driverId) : NO_SHOW_FINISH;
      if (
        !worst ||
        finish > worst.finish ||
        (finish === worst.finish &&
          new Date(race.race_datetime).getTime() > new Date(worst.race.race_datetime).getTime())
      ) {
        worst = { ri, race, finish };
      }
    });
    if (worst) {
      discards.push({
        cupId,
        raceIndex: worst.ri,
        raceId: worst.race.id,
        raceName: worst.race.name || null,
        finish: worst.finish === NO_SHOW_FINISH ? null : worst.finish
      });
    }
  });
  return discards;
}

export function calculateRankings(races, raceResults, options = {}) {
  const orderedRaces = [...races].sort((a, b) => new Date(a.race_datetime) - new Date(b.race_datetime));
  
  const resultsByRace = new Map();
  raceResults.forEach((result) => {
    if (!resultsByRace.has(result.race_id)) {
      resultsByRace.set(result.race_id, []);
    }
    resultsByRace.get(result.race_id).push(result);
  });

  // finish_position lookup per (raceId -> driverId -> finish) for discard
  // selection and no-show detection.
  const finishByRace = new Map();
  raceResults.forEach((result) => {
    if (!finishByRace.has(result.race_id)) finishByRace.set(result.race_id, new Map());
    const fp = Number(result.finish_position);
    finishByRace.get(result.race_id).set(result.driver_id, Number.isFinite(fp) ? fp : NO_SHOW_FINISH);
  });

  const driverStats = new Map();
  const driverRacePoints = new Map();
  const now = typeof options.now === 'number' ? options.now : Date.now();

  // Pre-pass: register every driver that appears in *any* race_result for the
  // races in scope, so a "no-show" in a single race still has a stats entry
  // and can have a discard slot considered against them.
  raceResults.forEach((result) => {
    const did = result.driver_id;
    if (did == null) return;
    if (!driverStats.has(did)) {
      driverStats.set(did, {
        driverId: did,
        name: result.drivers ? result.drivers.name : 'Unknown',
        picture: result.drivers ? result.drivers.picture_url : null,
        totalPoints: 0,
        bestPosition: null,
        positionCounts: {},
        poles: 0,
        fastestLaps: 0,
        penalties: 0,
        firstPenaltyAt: null,
        firstPenaltyFinish: null,
        reachedAt: null,
        racePoints: [],
        disqualifiedCount: 0,
        raceDirectionPenaltyPoints: 0,
        suspended: false,
        discards: []
      });
    }
    if (!driverRacePoints.has(did)) {
      driverRacePoints.set(did, {
        basePoints: Array(orderedRaces.length).fill(0),
        penalties: Array(orderedRaces.length).fill(0)
      });
    }
  });

  orderedRaces.forEach((race, raceIndex) => {
    const results = resultsByRace.get(race.id) || [];
    if (!results.length) return;
    
    const fastestLapWinner = getFastestLapWinner(results);
    const poleWinner = getPoleWinner(results);
    
    results.forEach((result) => {
      const driverId = result.driver_id;
      const stats = driverStats.get(driverId);
      const finishPosition = result.finish_position;
      const basePoints = getPositionPoints(finishPosition);
      const penalties = (result.penalties || []).reduce((sum, penalty) => {
        const count = Number(penalty.count || 0);
        const points = Number(penalty.point_deduction || 0);
        if (penalty.penalty_type === 'race_direction_warning') {
          stats.raceDirectionPenaltyPoints += points * count;
        }
        return sum + (points * count);
      }, 0);
      
      if (penalties !== 0 && race.race_datetime) {
        const penaltyTime = new Date(race.race_datetime).getTime();
        if (stats.firstPenaltyAt === null || penaltyTime < stats.firstPenaltyAt) {
          stats.firstPenaltyAt = penaltyTime;
          stats.firstPenaltyFinish = finishPosition || null;
        }
      }
      
      const ledger = driverRacePoints.get(driverId);
      ledger.basePoints[raceIndex] += basePoints;
      if (poleWinner === driverId) ledger.basePoints[raceIndex] += 1;
      if (fastestLapWinner === driverId) ledger.basePoints[raceIndex] += 1;
      ledger.penalties[raceIndex] += penalties;
      
      if (finishPosition) {
        stats.bestPosition = stats.bestPosition ? Math.min(stats.bestPosition, finishPosition) : finishPosition;
        stats.positionCounts[finishPosition] = (stats.positionCounts[finishPosition] || 0) + 1;
      }
      if (poleWinner === driverId) stats.poles += 1;
      if (fastestLapWinner === driverId) stats.fastestLaps += 1;
      stats.penalties += penalties;
      if (result.is_disqualified) {
        stats.disqualifiedCount += 1;
      }
      if (stats.raceDirectionPenaltyPoints <= -20) {
        stats.suspended = true;
      }
    });
  });
  
  const rankings = Array.from(driverStats.values());
  
  rankings.forEach((entry) => {
    const ledger = driverRacePoints.get(entry.driverId) || {
      basePoints: Array(orderedRaces.length).fill(0),
      penalties: Array(orderedRaces.length).fill(0)
    };
    // Per-cup discard: drop the worst race (by finish_position; no-show is
    // worst) for each cup whose last race has already happened.
    const cupDiscards = pickDiscardsByCup(orderedRaces, finishByRace, entry.driverId, now);
    const discardIndexMap = new Map(cupDiscards.map(d => [d.raceIndex, d]));
    entry.discards = cupDiscards.map((d) => {
      const bp = ledger.basePoints[d.raceIndex] || 0;
      const pen = ledger.penalties[d.raceIndex] || 0;
      // pointsRemoved = the total this race would have contributed before being
      // discarded (base + penalty). Penalties are negative, so this matches the
      // change in totalPoints for that race.
      const pointsRemoved = bp + pen;
      return {
        cupId: d.cupId,
        raceId: d.raceId,
        raceName: d.raceName,
        finish: d.finish,
        pointsRemoved
      };
    });
    entry.racePoints = ledger.basePoints.map((base, index) => {
      const penalties = ledger.penalties[index] || 0;
      if (discardIndexMap.has(index)) return 0; // discarded race contributes nothing
      return base + penalties;
    });
    const totalPoints = entry.racePoints.reduce((sum, value) => sum + value, 0);
    entry.totalPoints = totalPoints;
    let cumulative = 0;
    let reachedAt = null;
    orderedRaces.forEach((race, index) => {
      cumulative += entry.racePoints[index] || 0;
      if (reachedAt === null && cumulative >= totalPoints) {
        reachedAt = index;
      }
    });
    entry.reachedAt = reachedAt === null ? Number.MAX_SAFE_INTEGER : reachedAt;
  });
  
  rankings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    for (let position = 1; position <= 24; position += 1) {
      const diff = (b.positionCounts[position] || 0) - (a.positionCounts[position] || 0);
      if (diff !== 0) return diff;
    }
    if (b.poles !== a.poles) return b.poles - a.poles;
    if (b.fastestLaps !== a.fastestLaps) return b.fastestLaps - a.fastestLaps;
    if (a.penalties !== b.penalties) return b.penalties - a.penalties;
    if (a.reachedAt !== b.reachedAt) return a.reachedAt - b.reachedAt;
    return 0;
  });
  
  return rankings.map((entry, index) => ({
    rank: index + 1,
    ...entry
  }));
}

export function calculatePenaltyRankings(races, raceResults, options = {}) {
  const rankings = calculateRankings(races, raceResults, options);
  
  rankings.sort((a, b) => {
    const aPenalty = a.penalties || 0;
    const bPenalty = b.penalties || 0;
    if (aPenalty !== bPenalty) return aPenalty - bPenalty;
    const aFirst = a.firstPenaltyAt ?? Number.MAX_SAFE_INTEGER;
    const bFirst = b.firstPenaltyAt ?? Number.MAX_SAFE_INTEGER;
    if (aFirst !== bFirst) return aFirst - bFirst;
    const aFinish = a.firstPenaltyFinish ?? Number.MAX_SAFE_INTEGER;
    const bFinish = b.firstPenaltyFinish ?? Number.MAX_SAFE_INTEGER;
    if (aFinish !== bFinish) return bFinish - aFinish;
    return 0;
  });
  
  return rankings.map((entry, index) => ({
    rank: index + 1,
    ...entry
  }));
}
