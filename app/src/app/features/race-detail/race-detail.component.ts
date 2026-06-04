import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthStore } from '../../core/auth.store';
import { LoadingService } from '../../core/loading.service';
import type { Driver, Race, RaceResult } from '../../core/models';
import { calculatePenaltyPoints } from '../../core/points';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';
import { DriverImageComponent } from '../../shared/kt-driver-image/kt-driver-image.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import {
  RaceResultModalPayload,
  RaceResultModalService,
} from '../../shared/kt-race-result-modal/kt-race-result-modal.component';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { LapTimePipe } from '../../shared/pipes/lap-time.pipe';

@Component({
  selector: 'kt-race-detail',
  standalone: true,
  imports: [
    ButtonComponent,
    DriverImageComponent,
    EmptyStateComponent,
    DateTimePipe,
    LapTimePipe,
    RouterLink,
  ],
  templateUrl: './race-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceDetailComponent {
  /** Route parameter `raceId` via `withComponentInputBinding`. */
  readonly raceId = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  private readonly resultModal = inject(RaceResultModalService);
  private readonly confirm = inject(ConfirmDialogService);
  protected readonly auth = inject(AuthStore);

  protected readonly race = signal<Race | null>(null);
  protected readonly results = signal<RaceResult[]>([]);
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal<boolean>(false);

  /** Convenience: sorted by finish_position (defensive re-sort after mutations). */
  protected readonly sortedResults = computed(() =>
    [...this.results()].sort((a, b) => a.finish_position - b.finish_position),
  );

  constructor() { queueMicrotask(() => void this.load()); }

  private async load(): Promise<void> {
    this.error.set(null);
    try {
      const [race, results, drivers] = await Promise.all([
        this.api.getRace(this.raceId()),
        this.api.listRaceResults(this.raceId()),
        this.api.listDrivers(),
      ]);
      this.race.set(race);
      this.results.set(results);
      this.drivers.set(drivers);
    } catch (e) { this.error.set((e as Error).message); }
  }

  protected penaltyPoints(r: RaceResult): number {
    return calculatePenaltyPoints(r.penalties ?? []);
  }

  protected async addResult(): Promise<void> {
    const payload = await this.resultModal.open({
      drivers: this.drivers(),
      existingResults: this.results(),
    });
    if (payload) await this.persistResult(payload);
  }

  protected async editResult(r: RaceResult): Promise<void> {
    const payload = await this.resultModal.open({
      drivers: this.drivers(),
      existingResults: this.results(),
      initial: r,
    });
    if (payload) await this.persistResult(payload);
  }

  protected async deleteResult(r: RaceResult): Promise<void> {
    const ok = await this.confirm.open({
      title: $localize`Delete race result?`,
      message: $localize`This will remove the result and its penalties. The change is logged.`,
      confirmText: $localize`Delete`,
      confirmVariant: 'danger',
    });
    if (!ok) return;
    this.busy.set(true);
    try {
      await this.api.deletePenaltiesByRaceResult(r.id);
      await this.api.deleteRaceResult(r.id);
      await this.load();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  private async persistResult(payload: RaceResultModalPayload): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const rrFields: Record<string, unknown> = {
        race_id: this.raceId(),
        driver_id: payload.driver_id,
        finish_position: payload.finish_position,
        grid_start_position: payload.grid_start_position,
        best_lap_time: payload.best_lap_time,
        is_disqualified: payload.is_disqualified,
        comments: payload.comments,
      };
      let resultId: string;
      if (payload.id) {
        const updated = await this.api.updateRaceResult(payload.id, rrFields);
        resultId = updated.id;
        // Replace penalties wholesale to keep parity with v1 semantics.
        await this.api.deletePenaltiesByRaceResult(resultId);
      } else {
        const created = await this.api.createRaceResult(rrFields);
        resultId = created.id;
      }
      if (payload.penalties.length > 0) {
        await this.api.createPenalties(
          payload.penalties.map((p) => ({ ...p, race_result_id: resultId })),
        );
      }
      await this.load();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
