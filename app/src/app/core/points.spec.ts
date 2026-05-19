import { describe, expect, it } from 'vitest';

import { calculateRankings, parseLapTime } from './points';
import type { Race, RaceResult } from './models';

const baseRace = (overrides: Partial<Race>): Race => ({
  id: overrides.id ?? 'r1',
  season_id: 's1',
  cup_id: null,
  name: 'R',
  location: '',
  race_datetime: overrides.race_datetime ?? '2026-01-01T10:00:00Z',
  affects_championship: true,
  ...overrides,
});

describe('parseLapTime', () => {
  it('parses MM:SS.mmm', () => expect(parseLapTime('1:23.456')).toBe(83456));
  it('parses HH:MM:SS.mmm', () => expect(parseLapTime('1:02:03.004')).toBe(3723004));
  it('returns null for invalid', () => expect(parseLapTime('foo')).toBeNull());
});

describe('calculateRankings — pole + fastest-lap bonus is active', () => {
  it('awards +1 for pole and +1 for fastest lap', () => {
    const race = baseRace({ id: 'r1' });
    const results: RaceResult[] = [
      { id: '1', race_id: 'r1', driver_id: 'd1', finish_position: 1, grid_start_position: 1,
        best_lap_time: '1:10.000', is_disqualified: false, drivers: { id: 'd1', email: 'a@a', name: 'A' },
        penalties: [] },
      { id: '2', race_id: 'r1', driver_id: 'd2', finish_position: 2, grid_start_position: 2,
        best_lap_time: '1:20.000', is_disqualified: false, drivers: { id: 'd2', email: 'b@b', name: 'B' },
        penalties: [] },
    ];
    const ranking = calculateRankings([race], results);
    // d1: 35 (P1) + 1 (pole) + 1 (fastest) = 37
    expect(ranking[0]!.driverId).toBe('d1');
    expect(ranking[0]!.totalPoints).toBe(37);
    expect(ranking[1]!.driverId).toBe('d2');
    expect(ranking[1]!.totalPoints).toBe(30);
  });

  it('subtracts penalty points', () => {
    const race = baseRace({ id: 'r1' });
    const results: RaceResult[] = [
      { id: '1', race_id: 'r1', driver_id: 'd1', finish_position: 1, is_disqualified: false,
        drivers: { id: 'd1', email: '', name: 'A' },
        penalties: [{ id: 'p1', race_result_id: '1', penalty_type: 'cone_tire_warning',
          penalty_name: 'cone', point_deduction: -2, count: 2 }] },
    ];
    const ranking = calculateRankings([race], results);
    // 35 + 0 (no pole) + 0 (no FL parse — null) - 4 (penalty 2 x -2) = 31
    expect(ranking[0]!.totalPoints).toBe(31);
  });
});
