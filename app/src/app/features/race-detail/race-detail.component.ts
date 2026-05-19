import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import { ApiService } from '../../core/api.service';
import { AuthStore } from '../../core/auth.store';
import { LoadingService } from '../../core/loading.service';
import type { Driver, Race, RaceResult } from '../../core/models';
import { calculatePenaltyPoints } from '../../core/points';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { DriverImageComponent } from '../../shared/kt-driver-image/kt-driver-image.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { LapTimePipe } from '../../shared/pipes/lap-time.pipe';

@Component({
  selector: 'kt-race-detail',
  standalone: true,
  imports: [ButtonComponent, DriverImageComponent, EmptyStateComponent, DateTimePipe, LapTimePipe],
  templateUrl: './race-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceDetailComponent {
  /** Route parameter `raceId` via `withComponentInputBinding`. */
  readonly raceId = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  protected readonly auth = inject(AuthStore);

  protected readonly race = signal<Race | null>(null);
  protected readonly results = signal<RaceResult[]>([]);
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly error = signal<string | null>(null);

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

  /** Stub for now — full result editor lives in v1's RaceResultModal.
   *  TODO: port that modal into a `kt-race-result-modal` shared component. */
  protected addResult(): void {
    // Intentionally left as a TODO marker for the OCR/Result modal port.
    // See IMPLEMENTATION-STATUS.md.
    alert($localize`The race-result editor will be ported in a follow-up. For now use v1.`);
  }
}
