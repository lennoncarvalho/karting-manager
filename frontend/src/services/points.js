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

function getDiscardCount(races, options = {}) {
  if (Number.isFinite(options.discardCount)) {
    return Math.max(0, Math.floor(options.discardCount));
  }
  if (options.type === 'cup') {
    return races.length > 1 ? 1 : 0;
  }
  if (options.type === 'overall') {
    const cupIds = new Set();
    races.forEach((race) => {
      if (race.cup_id != null) {
        cupIds.add(race.cup_id);
      }
    });
    return cupIds.size;
  }
  const cupIds = new Set();
  races.forEach((race) => {
    if (race.cup_id != null) {
      cupIds.add(race.cup_id);
    }
  });
  if (cupIds.size === 1 && races.length > 1) {
    return 1;
  }
  return cupIds.size;
}

function getDiscardIndices(basePoints, discardCount) {
  if (!discardCount) {
    return new Set();
  }
  const count = Math.min(discardCount, basePoints.length);
  const sorted = basePoints.map((points, index) => ({ points, index }))
    .sort((a, b) => (a.points - b.points) || (a.index - b.index));
  return new Set(sorted.slice(0, count).map(entry => entry.index));
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
  
  const driverStats = new Map();
  const driverRacePoints = new Map();
  const discardCount = getDiscardCount(orderedRaces, options);
  
  orderedRaces.forEach((race, raceIndex) => {
    const results = resultsByRace.get(race.id) || [];
    if (!results.length) return;
    
    const fastestLapWinner = getFastestLapWinner(results);
    const poleWinner = getPoleWinner(results);
    
    results.forEach((result) => {
      const driverId = result.driver_id;
      if (!driverStats.has(driverId)) {
        driverStats.set(driverId, {
          driverId,
          name: result.drivers ? result.drivers.name : 'Unknown',
          picture: result.drivers ? result.drivers.picture_url : null,
          totalPoints: 0,
          bestPosition: result.finish_position || null,
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
          suspended: false
        });
      }
      if (!driverRacePoints.has(driverId)) {
        driverRacePoints.set(driverId, {
          basePoints: Array(orderedRaces.length).fill(0),
          penalties: Array(orderedRaces.length).fill(0)
        });
      }
      
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
    const discardIndices = getDiscardIndices(ledger.basePoints, discardCount);
    entry.racePoints = ledger.basePoints.map((base, index) => {
      const penalties = ledger.penalties[index] || 0;
      if (discardIndices.has(index)) {
        return penalties;
      }
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
