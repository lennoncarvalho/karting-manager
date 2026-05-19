import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import type { Cup, Driver, Penalty, Race, RaceResult, Season } from './models';

/**
 * Domain CRUD service. Mirrors `frontend/src/services/api.js` but
 * returns typed rows. RaceResult mutations push the previous row state
 * into `race_results_log` for audit (spec 009 / spec 010 §6.9).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly supa = inject(SupabaseService);

  // ── Seasons ────────────────────────────────────────────────────────
  async listSeasons(): Promise<Season[]> {
    const { data, error } = await this.supa.client
      .from('seasons').select('*').order('end_date', { ascending: false });
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data ?? []) as Season[];
  }
  async createSeason(payload: Partial<Season>): Promise<Season> {
    const { data, error } = await this.supa.client.from('seasons').insert([payload]).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as Season;
  }
  async updateSeason(id: string, updates: Partial<Season>): Promise<Season> {
    const { data, error } = await this.supa.client.from('seasons').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as Season;
  }
  async deleteSeason(id: string): Promise<void> {
    const { error } = await this.supa.client.from('seasons').delete().eq('id', id);
    if (error) throw new Error(SupabaseService.humanize(error));
  }

  // ── Drivers ────────────────────────────────────────────────────────
  async listDrivers(): Promise<Driver[]> {
    const { data, error } = await this.supa.client.from('drivers').select('*').order('name', { ascending: true });
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data ?? []) as Driver[];
  }
  async createDriver(payload: Partial<Driver>): Promise<Driver> {
    const { data, error } = await this.supa.client.from('drivers').insert([payload]).select('*').single();
    if (error) {
      if (error.code === '23505') throw new Error('Email already exists. Please use a different email.');
      throw new Error(SupabaseService.humanize(error));
    }
    return data as Driver;
  }
  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    const { data, error } = await this.supa.client.from('drivers').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as Driver;
  }
  async deleteDriver(id: string): Promise<void> {
    const { error } = await this.supa.client.from('drivers').delete().eq('id', id);
    if (error) throw new Error(SupabaseService.humanize(error));
  }

  // ── Cups ───────────────────────────────────────────────────────────
  async listCups(seasonId?: string): Promise<Cup[]> {
    let q = this.supa.client.from('cups').select('*').order('start_date', { ascending: true });
    if (seasonId) q = q.eq('season_id', seasonId);
    const { data, error } = await q;
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data ?? []) as Cup[];
  }
  async createCup(payload: Partial<Cup>): Promise<Cup> {
    const { data, error } = await this.supa.client.from('cups').insert([payload]).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as Cup;
  }
  async updateCup(id: string, updates: Partial<Cup>): Promise<Cup> {
    const { data, error } = await this.supa.client.from('cups').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as Cup;
  }
  async deleteCup(id: string): Promise<void> {
    const { error } = await this.supa.client.from('cups').delete().eq('id', id);
    if (error) throw new Error(SupabaseService.humanize(error));
  }

  // ── Races ──────────────────────────────────────────────────────────
  async listRaces(opts: { seasonId?: string; cupId?: string } = {}): Promise<Race[]> {
    let q = this.supa.client.from('races').select('*').order('race_datetime', { ascending: true });
    if (opts.seasonId) q = q.eq('season_id', opts.seasonId);
    if (opts.cupId) q = q.eq('cup_id', opts.cupId);
    const { data, error } = await q;
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data ?? []) as Race[];
  }
  async getRace(id: string): Promise<Race | null> {
    const { data, error } = await this.supa.client.from('races').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data as Race) ?? null;
  }
  async createRace(payload: Partial<Race>): Promise<Race> {
    const { data, error } = await this.supa.client.from('races').insert([payload]).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as Race;
  }
  async updateRace(id: string, updates: Partial<Race>): Promise<Race> {
    const { data, error } = await this.supa.client.from('races').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as Race;
  }
  async deleteRace(id: string): Promise<void> {
    const { error } = await this.supa.client.from('races').delete().eq('id', id);
    if (error) throw new Error(SupabaseService.humanize(error));
  }

  // ── Race Results (with audit log) ──────────────────────────────────
  async listRaceResults(raceId: string): Promise<RaceResult[]> {
    const { data, error } = await this.supa.client
      .from('race_results').select('*, drivers(*), penalties(*)')
      .eq('race_id', raceId).order('finish_position', { ascending: true });
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data ?? []) as RaceResult[];
  }
  async listRaceResultsByRaceIds(raceIds: string[]): Promise<RaceResult[]> {
    if (!raceIds.length) return [];
    const { data, error } = await this.supa.client
      .from('race_results').select('*, drivers(*), penalties(*)').in('race_id', raceIds);
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data ?? []) as RaceResult[];
  }
  async createRaceResult(payload: Partial<RaceResult>): Promise<RaceResult> {
    const { data, error } = await this.supa.client.from('race_results').insert([payload]).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as RaceResult;
  }
  async updateRaceResult(id: string, updates: Partial<RaceResult>): Promise<RaceResult> {
    await this.logRaceResultBeforeChange(id);
    const { data, error } = await this.supa.client
      .from('race_results').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(SupabaseService.humanize(error));
    return data as RaceResult;
  }
  async deleteRaceResult(id: string): Promise<void> {
    await this.logRaceResultBeforeChange(id);
    const { error } = await this.supa.client.from('race_results').delete().eq('id', id);
    if (error) throw new Error(SupabaseService.humanize(error));
  }
  private async logRaceResultBeforeChange(id: string): Promise<void> {
    const { data: current, error: e1 } = await this.supa.client
      .from('race_results').select('*').eq('id', id).single();
    if (e1) throw new Error(SupabaseService.humanize(e1));
    const { data: { session } } = await this.supa.client.auth.getSession();
    const userId = session?.user?.id ?? null;
    // Strip joined columns before insert
    const { drivers: _d, penalties: _p, ...columns } = current as Record<string, unknown> & {
      drivers?: unknown; penalties?: unknown;
    };
    const { error: e2 } = await this.supa.client
      .from('race_results_log').insert([{ ...columns, changed_by_user_id: userId }]);
    if (e2) throw new Error(SupabaseService.humanize(e2));
  }

  // ── Penalties ──────────────────────────────────────────────────────
  async createPenalties(penalties: Partial<Penalty>[]): Promise<Penalty[]> {
    if (!penalties.length) return [];
    const { data, error } = await this.supa.client.from('penalties').insert(penalties).select('*');
    if (error) throw new Error(SupabaseService.humanize(error));
    return (data ?? []) as Penalty[];
  }
  async deletePenaltiesByRaceResult(raceResultId: string): Promise<void> {
    const { error } = await this.supa.client.from('penalties').delete().eq('race_result_id', raceResultId);
    if (error) throw new Error(SupabaseService.humanize(error));
  }
}
