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

export function calculateRankings(races, raceResults) {
  const raceMap = new Map(races.map(race => [race.id, race]));
  const orderedRaces = [...races].sort((a, b) => new Date(a.race_datetime) - new Date(b.race_datetime));
  
  const resultsByRace = new Map();
  raceResults.forEach((result) => {
    if (!resultsByRace.has(result.race_id)) {
      resultsByRace.set(result.race_id, []);
    }
    resultsByRace.get(result.race_id).push(result);
  });
  
  const driverStats = new Map();
  
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
          reachedAt: null,
          racePoints: [],
          disqualifiedCount: 0,
          raceDirectionPenaltyPoints: 0,
          suspended: false
        });
      }
      
      const stats = driverStats.get(driverId);
      const finishPosition = result.finish_position;
      const basePoints = getPositionPoints(finishPosition);
      const poleBonus = poleWinner === driverId ? 1 : 0;
      const fastestBonus = fastestLapWinner === driverId ? 1 : 0;
      const penalties = (result.penalties || []).reduce((sum, penalty) => {
        const count = Number(penalty.count || 0);
        const points = Number(penalty.point_deduction || 0);
        if (penalty.penalty_type === 'race_direction_warning') {
          stats.raceDirectionPenaltyPoints += points * count;
        }
        return sum + (points * count);
      }, 0);
      const totalForRace = basePoints + poleBonus + fastestBonus + penalties;
      
      stats.totalPoints += totalForRace;
      stats.bestPosition = stats.bestPosition ? Math.min(stats.bestPosition, finishPosition) : finishPosition;
      stats.positionCounts[finishPosition] = (stats.positionCounts[finishPosition] || 0) + 1;
      if (poleBonus) stats.poles += 1;
      if (fastestBonus) stats.fastestLaps += 1;
      stats.penalties += penalties;
      if (result.is_disqualified) {
        stats.disqualifiedCount += 1;
      }
      if (stats.raceDirectionPenaltyPoints <= -20) {
        stats.suspended = true;
      }
      
      stats.racePoints[raceIndex] = (stats.racePoints[raceIndex] || 0) + totalForRace;
    });
  });
  
  const rankings = Array.from(driverStats.values());
  
  rankings.forEach((entry) => {
    const totalPoints = entry.totalPoints;
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
