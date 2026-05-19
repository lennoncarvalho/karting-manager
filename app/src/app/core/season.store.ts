import { Injectable, computed, effect, inject, signal } from '@angular/core';

import type { Season } from './models';
import { SupabaseService } from './supabase.service';
import { ThemeService } from './theme.service';
import { readJson, readString, writeJson, writeString, remove } from './storage.util';

const SEASONS_CACHE_KEY = 'seasonsCache';
const SEASONS_BY_ID_KEY = 'seasonsCacheById';
const SELECTED_SEASON_KEY = 'selectedSeasonId';

/**
 * Owns the seasons list, the selected season, and applies its accent
 * color via ThemeService. Mirrors v1's split between
 * `services/api.js` (seasons cache) and `services/theme.js`.
 */
@Injectable({ providedIn: 'root' })
export class SeasonStore {
  private readonly supa = inject(SupabaseService);
  private readonly theme = inject(ThemeService);

  readonly seasons = signal<Season[]>([]);
  readonly selectedSeasonId = signal<string | null>(null);
  readonly loaded = signal(false);

  readonly selectedSeason = computed<Season | null>(() => {
    const id = this.selectedSeasonId();
    if (!id) return null;
    return this.seasons().find((s) => String(s.id) === id) ?? null;
  });

  readonly ongoingSeason = computed<Season | null>(() => {
    return this.seasons().find((s) => s.is_ongoing) ?? null;
  });

  constructor() {
    // Whenever the selected season changes, re-apply its accent color.
    effect(() => {
      const season = this.selectedSeason();
      if (season) this.theme.applySeasonTheme(season);
    });
  }

  /** Called once at startup (APP_INITIALIZER) — uses cache if available. */
  async bootstrap(): Promise<void> {
    const cached = readJson<Season[]>(SEASONS_CACHE_KEY);
    if (cached?.length) {
      this.seasons.set(cached);
    } else {
      await this.refresh();
    }
    const storedId = readString(SELECTED_SEASON_KEY);
    if (storedId && this.seasons().some((s) => String(s.id) === storedId)) {
      this.selectedSeasonId.set(storedId);
    } else {
      // Fall back to the ongoing season, or the latest one by end_date.
      const fallback = this.ongoingSeason() ?? this.seasons()[0] ?? null;
      if (fallback) this.selectedSeasonId.set(String(fallback.id));
    }
    this.loaded.set(true);
  }

  /** Force-refresh the seasons list from Supabase and update caches. */
  async refresh(): Promise<Season[]> {
    const { data, error } = await this.supa.client
      .from('seasons')
      .select('*')
      .order('end_date', { ascending: false });
    if (error) throw new Error(SupabaseService.humanize(error));
    const list = (data ?? []) as Season[];
    this.seasons.set(list);
    writeJson(SEASONS_CACHE_KEY, list);
    const byId: Record<string, Season> = {};
    for (const s of list) byId[String(s.id)] = s;
    writeJson(SEASONS_BY_ID_KEY, byId);
    return list;
  }

  select(id: string | null): void {
    this.selectedSeasonId.set(id);
    if (id) writeString(SELECTED_SEASON_KEY, id);
    else remove(SELECTED_SEASON_KEY);
  }

  /** Insert or replace a single season in the in-memory list + cache. */
  upsert(season: Season): void {
    const list = [...this.seasons()];
    const idx = list.findIndex((s) => String(s.id) === String(season.id));
    if (idx >= 0) list[idx] = season;
    else list.push(season);
    list.sort((a, b) => (b.end_date ?? '').localeCompare(a.end_date ?? ''));
    this.seasons.set(list);
    writeJson(SEASONS_CACHE_KEY, list);
  }

  removeLocal(id: string): void {
    const list = this.seasons().filter((s) => String(s.id) !== String(id));
    this.seasons.set(list);
    writeJson(SEASONS_CACHE_KEY, list);
    if (this.selectedSeasonId() === String(id)) this.select(null);
  }
}
