export function parseLapTime(value) {
  if (!value) return null;
  const parts = value.split(":");
  let hours = 0,
    minutes = 0,
    secondsPart = "";
  if (parts.length === 3) {
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
    secondsPart = parts[2];
  } else if (parts.length === 2) {
    minutes = Number(parts[0]);
    secondsPart = parts[1];
  } else return null;
  const [secondsStr, millisStr = "0"] = secondsPart.split(".");
  const seconds = Number(secondsStr);
  const millis = Number(millisStr.padEnd(3, "0"));
  if ([hours, minutes, seconds, millis].some(Number.isNaN)) return null;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}

const pointsTable = {
  1: 35,
  2: 30,
  3: 26,
  4: 23,
  5: 21,
  6: 19,
  7: 18,
  8: 17,
  9: 16,
  10: 15,
  11: 14,
  12: 13,
  13: 12,
  14: 11,
  15: 10,
  16: 9,
  17: 8,
  18: 7,
  19: 6,
  20: 5,
  21: 4,
  22: 3,
  23: 2,
  24: 1,
};

function getPositionPoints(position) {
  return pointsTable[position] || 0;
}

export function calculatePenaltyPoints(penalties = []) {
  return penalties.reduce((total, p) => {
    const count = Number(p.count || 0);
    const points = Number(p.point_deduction || 0);
    return total + points * count;
  }, 0);
}

function getFastestLapWinner(results) {
  let best = null;
  results.forEach((result) => {
    const time = parseLapTime(result.best_lap_time);
    if (time === null) return;
    if (!best || time < best.time) {
      best = { id: result.driver_id, time, finish: result.finish_position };
    } else if (time === best.time && result.finish_position < best.finish) {
      best = { id: result.driver_id, time, finish: result.finish_position };
    }
  });
  return best ? best.id : null;
}

function getPoleWinner(results) {
  const pole = results.find((r) => r.grid_start_position === 1);
  return pole ? pole.driver_id : null;
}

function getDiscardCount(races, options = {}) {
  if (Number.isFinite(options.discardCount))
    return Math.max(0, Math.floor(options.discardCount));
  if (options.type === "cup") return races.length > 1 ? 1 : 0;
  if (options.type === "overall") {
    const cupIds = new Set();
    races.forEach((r) => {
      if (r.cup_id != null) cupIds.add(r.cup_id);
    });
    return cupIds.size;
  }
  const cupIds = new Set();
  races.forEach((r) => {
    if (r.cup_id != null) cupIds.add(r.cup_id);
  });
  if (cupIds.size === 1 && races.length > 1) return 1;
  return cupIds.size;
}

function getDiscardIndices(basePoints, discardCount) {
  if (!discardCount) return new Set();
  const count = Math.min(discardCount, basePoints.length);
  const sorted = basePoints
    .map((p, i) => ({ points: p, index: i }))
    .sort((a, b) => a.points - b.points || a.index - b.index);
  return new Set(sorted.slice(0, count).map((e) => e.index));
}

export function calculateRankings(races, raceResults, options = {}) {
  const ordered = [...races].sort(
    (a, b) => new Date(a.race_datetime) - new Date(b.race_datetime),
  );
  const byRace = new Map();
  raceResults.forEach((r) => {
    if (!byRace.has(r.race_id)) byRace.set(r.race_id, []);
    byRace.get(r.race_id).push(r);
  });
  const stats = new Map();
  const ledger = new Map();
  const discardCount = getDiscardCount(ordered, options);

  ordered.forEach((race, ri) => {
    const results = byRace.get(race.id) || [];
    if (!results.length) return;
    const fastestId = getFastestLapWinner(results);
    const poleId = getPoleWinner(results);
    results.forEach((result) => {
      const did = result.driver_id;
      if (!stats.has(did)) {
        stats.set(did, {
          driverId: did,
          name: result.drivers?.name || "Unknown",
          picture: result.drivers?.picture_url || null,
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
          suspended: false,
        });
      }
      if (!ledger.has(did))
        ledger.set(did, {
          basePoints: Array(ordered.length).fill(0),
          penalties: Array(ordered.length).fill(0),
        });
      const s = stats.get(did);
      const fp = result.finish_position;
      const bp = getPositionPoints(fp);
      const p = (result.penalties || []).reduce((sum, pen) => {
        const c = Number(pen.count || 0);
        const pt = Number(pen.point_deduction || 0);
        if (pen.penalty_type === "race_direction_warning")
          s.raceDirectionPenaltyPoints += pt * c;
        return sum + pt * c;
      }, 0);
      if (p !== 0 && race.race_datetime) {
        const pt = new Date(race.race_datetime).getTime();
        if (s.firstPenaltyAt === null || pt < s.firstPenaltyAt) {
          s.firstPenaltyAt = pt;
          s.firstPenaltyFinish = fp || null;
        }
      }
      const l = ledger.get(did);
      l.basePoints[ri] += bp;
      if (poleId === did) l.basePoints[ri] += 1;
      if (fastestId === did) l.basePoints[ri] += 1;
      l.penalties[ri] += p;
      if (fp) {
        s.bestPosition = s.bestPosition ? Math.min(s.bestPosition, fp) : fp;
        s.positionCounts[fp] = (s.positionCounts[fp] || 0) + 1;
      }
      if (poleId === did) s.poles += 1;
      if (fastestId === did) s.fastestLaps += 1;
      s.penalties += p;
      if (result.is_disqualified) s.disqualifiedCount += 1;
      if (s.raceDirectionPenaltyPoints <= -20) s.suspended = true;
    });
  });

  const rankings = Array.from(stats.values());
  rankings.forEach((entry) => {
    const l = ledger.get(entry.driverId) || {
      basePoints: Array(ordered.length).fill(0),
      penalties: Array(ordered.length).fill(0),
    };
    const di = getDiscardIndices(l.basePoints, discardCount);
    entry.racePoints = l.basePoints.map((bp, i) => {
      const p = l.penalties[i] || 0;
      if (di.has(i)) return p;
      return bp + p;
    });
    entry.totalPoints = entry.racePoints.reduce((s, v) => s + v, 0);
    let cum = 0,
      reached = null;
    ordered.forEach((_, i) => {
      cum += entry.racePoints[i] || 0;
      if (reached === null && cum >= entry.totalPoints) reached = i;
    });
    entry.reachedAt = reached === null ? Number.MAX_SAFE_INTEGER : reached;
  });

  rankings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    for (let pos = 1; pos <= 24; pos++) {
      const diff = (b.positionCounts[pos] || 0) - (a.positionCounts[pos] || 0);
      if (diff !== 0) return diff;
    }
    if (b.poles !== a.poles) return b.poles - a.poles;
    if (b.fastestLaps !== a.fastestLaps) return b.fastestLaps - a.fastestLaps;
    if (a.penalties !== b.penalties) return b.penalties - a.penalties;
    if (a.reachedAt !== b.reachedAt) return a.reachedAt - b.reachedAt;
    return 0;
  });

  return rankings.map((e, i) => ({ rank: i + 1, ...e }));
}

export function calculatePenaltyRankings(races, raceResults, options = {}) {
  const rankings = calculateRankings(races, raceResults, options);
  rankings.sort((a, b) => {
    const ap = a.penalties || 0,
      bp = b.penalties || 0;
    if (ap !== bp) return ap - bp;
    const af = a.firstPenaltyAt ?? Number.MAX_SAFE_INTEGER;
    const bf = b.firstPenaltyAt ?? Number.MAX_SAFE_INTEGER;
    if (af !== bf) return af - bf;
    const aFin = a.firstPenaltyFinish ?? Number.MAX_SAFE_INTEGER;
    const bFin = b.firstPenaltyFinish ?? Number.MAX_SAFE_INTEGER;
    if (aFin !== bFin) return bFin - aFin;
    return 0;
  });
  return rankings.map((e, i) => ({ rank: i + 1, ...e }));
}
