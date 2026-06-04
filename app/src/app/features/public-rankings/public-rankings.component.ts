import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { ApiService } from '../../core/api.service';
import { AuthStore } from '../../core/auth.store';
import { SeasonStore } from '../../core/season.store';
import { LoadingService } from '../../core/loading.service';
import { calculateRankings, calculatePenaltyRankings, RankingEntry } from '../../core/points';
import type { Cup, Driver, Race, RaceResult } from '../../core/models';
import { DriverImageComponent } from '../../shared/kt-driver-image/kt-driver-image.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { SkeletonRowComponent } from '../../shared/kt-skeleton-row/kt-skeleton-row.component';
import { LapTimePipe } from '../../shared/pipes/lap-time.pipe';

interface CalendarRow {
  race: Race;
  winner: Driver | null;
  fastestLapDriver: Driver | null;
  fastestLapTime: string | null;
}

/**
 * Public rankings landing page.
 *
 * Tabs (via `ngbNav`):
 *  - Calendar   — chronological race list with winner + fastest lap
 *  - Overall    — championship-wide ranking (only `affects_championship` races)
 *  - <Cup name> — per-cup rankings, one tab each, sorted by `cups.start_date`
 *  - Penalties  — per-driver penalty totals (last tab)
 */
@Component({
  selector: 'kt-public-rankings',
  standalone: true,
  imports: [
    NgbNavModule,
    RouterLink,
    NgTemplateOutlet,
    DatePipe,
    DriverImageComponent,
    EmptyStateComponent,
    SkeletonRowComponent,
    LapTimePipe,
  ],
  templateUrl: './public-rankings.component.html',
  styleUrl: './public-rankings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRankingsComponent {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  protected readonly seasonStore = inject(SeasonStore);
  protected readonly auth = inject(AuthStore);

  /** Active tab id: 'calendar' | 'overall' | 'cup:<id>' | 'penalty'. */
  protected readonly activeTab = signal<string>('calendar');

  protected readonly cups = signal<Cup[]>([]);
  protected readonly races = signal<Race[]>([]);
  protected readonly results = signal<RaceResult[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loadingList = signal<boolean>(true);

  /** Seasons surfaced in the season selector — only those `is_ongoing`. */
  protected readonly ongoingSeasons = computed(() =>
    this.seasonStore.seasons().filter((s) => s.is_ongoing),
  );

  /** Cups sorted by `start_date` asc (per the resume plan). */
  protected readonly sortedCups = computed(() =>
    [...this.cups()].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')),
  );

  protected readonly overallRanking = computed<RankingEntry[]>(() => {
    const overallRaces = this.races().filter((r) => r.affects_championship);
    return calculateRankings(overallRaces, this.results(), { type: 'overall' });
  });

  protected readonly penaltyRanking = computed<RankingEntry[]>(() => {
    const overallRaces = this.races().filter((r) => r.affects_championship);
    return calculatePenaltyRankings(overallRaces, this.results(), { type: 'overall' });
  });

  /** Build calendar rows with winner + fastest-lap-driver per race. */
  protected readonly calendarRows = computed<CalendarRow[]>(() => {
    const races = [...this.races()].sort((a, b) =>
      (a.race_datetime ?? '').localeCompare(b.race_datetime ?? ''),
    );
    const resultsByRace = new Map<string, RaceResult[]>();
    for (const r of this.results()) {
      const arr = resultsByRace.get(r.race_id) ?? [];
      arr.push(r);
      resultsByRace.set(r.race_id, arr);
    }
    return races.map((race): CalendarRow => {
      const bucket = resultsByRace.get(race.id) ?? [];
      const winner =
        bucket
          .filter((r) => !r.is_disqualified)
          .sort((a, b) => a.finish_position - b.finish_position)[0]?.drivers ?? null;
      const withLap = bucket.filter((r) => !!r.best_lap_time && !r.is_disqualified);
      withLap.sort((a, b) => (a.best_lap_time ?? '').localeCompare(b.best_lap_time ?? ''));
      const fastest = withLap[0];
      return {
        race,
        winner,
        fastestLapDriver: fastest?.drivers ?? null,
        fastestLapTime: fastest?.best_lap_time ?? null,
      };
    });
  });

  /** Per-cup ranking memoised lazily by tab id. */
  protected cupRanking(cupId: string): RankingEntry[] {
    const cupRaces = this.races().filter((r) => r.cup_id === cupId);
    return calculateRankings(cupRaces, this.results(), { type: 'cup' });
  }

  constructor() {
    effect(() => {
      const seasonId = this.seasonStore.selectedSeasonId();
      if (seasonId) void this.load(seasonId);
    });
  }

  protected onSeasonChange(value: string): void {
    this.seasonStore.select(value || null);
  }

  private async load(seasonId: string): Promise<void> {
    this.error.set(null);
    this.loadingList.set(true);
    try {
      await this.loading.track(
        (async () => {
          const [cups, races] = await Promise.all([
            this.api.listCups(seasonId),
            this.api.listRaces({ seasonId }),
          ]);
          this.cups.set(cups);
          this.races.set(races);
          const raceIds = races.map((r) => r.id);
          const results = await this.api.listRaceResultsByRaceIds(raceIds);
          this.results.set(results);
        })(),
      );
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loadingList.set(false);
    }
  }
}
