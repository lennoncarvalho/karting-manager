import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { ApiService } from '../../core/api.service';
import { SeasonStore } from '../../core/season.store';
import { LoadingService } from '../../core/loading.service';
import { calculateRankings, calculatePenaltyRankings, RankingEntry } from '../../core/points';
import type { Cup, Race, RaceResult } from '../../core/models';
import { DriverImageComponent } from '../../shared/kt-driver-image/kt-driver-image.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { AccentHeaderDirective } from '../../shared/directives/accent-header.directive';

type ViewMode = 'overall' | 'cup' | 'penalty';

@Component({
  selector: 'kt-public-rankings',
  standalone: true,
  imports: [DriverImageComponent, EmptyStateComponent, AccentHeaderDirective],
  templateUrl: './public-rankings.component.html',
  styleUrl: './public-rankings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRankingsComponent {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  protected readonly seasonStore = inject(SeasonStore);

  protected readonly mode = signal<ViewMode>('overall');
  protected readonly selectedCupId = signal<string | null>(null);
  protected readonly cups = signal<Cup[]>([]);
  protected readonly races = signal<Race[]>([]);
  protected readonly results = signal<RaceResult[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly rankingForView = computed<RankingEntry[]>(() => {
    const allRaces = this.races();
    if (this.mode() === 'cup' && this.selectedCupId()) {
      const cupRaces = allRaces.filter((r) => r.cup_id === this.selectedCupId());
      return calculateRankings(cupRaces, this.results(), { type: 'cup' });
    }
    if (this.mode() === 'penalty') {
      const overallRaces = allRaces.filter((r) => r.affects_championship);
      return calculatePenaltyRankings(overallRaces, this.results(), { type: 'overall' });
    }
    const overallRaces = allRaces.filter((r) => r.affects_championship);
    return calculateRankings(overallRaces, this.results(), { type: 'overall' });
  });

  constructor() {
    // Reload data whenever the selected season changes.
    effect(() => {
      const seasonId = this.seasonStore.selectedSeasonId();
      if (seasonId) void this.load(seasonId);
    });
  }

  private async load(seasonId: string): Promise<void> {
    this.error.set(null);
    try {
      await this.loading.track((async () => {
        const [cups, races] = await Promise.all([
          this.api.listCups(seasonId),
          this.api.listRaces({ seasonId }),
        ]);
        this.cups.set(cups);
        this.races.set(races);
        const raceIds = races.map((r) => r.id);
        const results = await this.api.listRaceResultsByRaceIds(raceIds);
        this.results.set(results);
      })());
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  protected setMode(mode: ViewMode): void {
    this.mode.set(mode);
    if (mode !== 'cup') this.selectedCupId.set(null);
    else if (!this.selectedCupId() && this.cups().length) {
      this.selectedCupId.set(this.cups()[0]!.id);
    }
  }
}
