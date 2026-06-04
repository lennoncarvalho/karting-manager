import { ChangeDetectionStrategy, Component, inject, Injectable, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import type { Driver, Penalty, RaceResult } from '../../core/models';
import { isPositiveInteger, isRequired, isValidLapTime } from '../validators';

/**
 * Race-result editor modal — port of v1 `RaceResultModal.js`.
 *
 * Open through {@link RaceResultModalService.open}; resolves with a
 * `RaceResultModalPayload` on save (caller persists it via
 * `ApiService.createRaceResult` / `updateRaceResult` +
 * `createPenalties`) or `null` when the operator dismisses.
 */

/** Mirrors v1's hard-coded standard penalty rows. */
const STANDARD_PENALTIES: ReadonlyArray<{
  type: Exclude<Penalty['penalty_type'], 'custom'>;
  name: string;
  points: number;
}> = [
  { type: 'disqualification', name: 'Disqualification', points: -8 },
  { type: 'cone_tire_warning', name: 'Cone/Tire Warning', points: -2 },
  { type: 'race_direction_warning', name: 'Race Direction Warning', points: -4 },
  { type: 'stop_and_go', name: 'Stop and Go', points: -6 },
  { type: 'missing_club_shirt', name: 'Missing Club Shirt', points: -2 },
];

export interface RaceResultModalPayload {
  /** Existing result id when editing, `null` when creating. */
  id: string | null;
  driver_id: string;
  finish_position: number;
  grid_start_position: number | null;
  best_lap_time: string | null;
  is_disqualified: boolean;
  comments: string | null;
  /** Standard + custom penalty rows the caller must persist. */
  penalties: Array<{
    penalty_type: Penalty['penalty_type'];
    penalty_name: string;
    point_deduction: number;
    count: number;
  }>;
}

export interface RaceResultModalOptions {
  drivers: Driver[];
  /** All results for this race (used to disable already-used drivers). */
  existingResults: RaceResult[];
  /** When provided, the modal opens in edit mode. */
  initial?: RaceResult | null;
}

interface CustomRow { name: string; points: number | null; count: number | null; }

@Component({
  selector: 'kt-race-result-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        @if (isEdit()) { <ng-container i18n>Edit race result</ng-container> }
        @else { <ng-container i18n>Add race result</ng-container> }
      </h5>
      <button type="button" class="btn-close btn-close-white" (click)="cancel()" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <form (ngSubmit)="$event.preventDefault(); save()">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="rr-driver" i18n>Driver</label>
            <select id="rr-driver" class="form-select" [(ngModel)]="driverId" name="driverId"
                    [class.is-invalid]="errors().driver" required>
              <option value="" i18n>Select driver</option>
              @for (d of drivers; track d.id) {
                <option [value]="d.id" [disabled]="isDriverDisabled(d.id)">{{ d.name }}</option>
              }
            </select>
            @if (errors().driver) {
              <div class="invalid-feedback d-block">{{ errors().driver }}</div>
            }
          </div>
          <div class="col-md-3">
            <label class="form-label" for="rr-finish" i18n>Finish position</label>
            <input id="rr-finish" type="number" min="1" class="form-control"
                   [(ngModel)]="finishPos" name="finishPos"
                   [class.is-invalid]="errors().finish" required>
            @if (errors().finish) {
              <div class="invalid-feedback d-block">{{ errors().finish }}</div>
            }
          </div>
          <div class="col-md-3">
            <label class="form-label" for="rr-grid" i18n>Grid start</label>
            <input id="rr-grid" type="number" min="1" class="form-control"
                   [(ngModel)]="gridPos" name="gridPos"
                   [class.is-invalid]="errors().grid">
            @if (errors().grid) {
              <div class="invalid-feedback d-block">{{ errors().grid }}</div>
            }
          </div>
          <div class="col-md-6">
            <label class="form-label" for="rr-best-lap" i18n>Best lap time</label>
            <input id="rr-best-lap" type="text" class="form-control" placeholder="MM:SS.mmm"
                   [(ngModel)]="bestLap" name="bestLap"
                   [class.is-invalid]="errors().bestLap">
            @if (errors().bestLap) {
              <div class="invalid-feedback d-block">{{ errors().bestLap }}</div>
            }
          </div>
          <div class="col-md-6 d-flex align-items-end">
            <div class="form-check">
              <input id="rr-dsq" class="form-check-input" type="checkbox"
                     [(ngModel)]="isDsq" name="isDsq">
              <label class="form-check-label" for="rr-dsq" i18n>Disqualified</label>
            </div>
          </div>
          <div class="col-12">
            <label class="form-label" for="rr-comments" i18n>Comments</label>
            <textarea id="rr-comments" class="form-control" rows="2"
                      [(ngModel)]="comments" name="comments"></textarea>
          </div>
        </div>

        <hr>
        <h6 class="mb-3" i18n>Standard penalties</h6>
        <div class="row g-3">
          @for (sp of standardPenalties; track sp.type; let i = $index) {
            <div class="col-md-4">
              <label class="form-label">{{ sp.name }} ({{ sp.points }})</label>
              <input type="number" min="0" class="form-control"
                     [ngModel]="standardCounts()[i]" name="std-{{ i }}"
                     (ngModelChange)="setStandardCount(i, $event)">
            </div>
          }
        </div>

        <hr>
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h6 class="mb-0" i18n>Custom penalties</h6>
          <button type="button" class="btn btn-outline-primary btn-sm" (click)="addCustomRow()" i18n>
            Add
          </button>
        </div>
        @for (row of customRows(); track $index; let i = $index) {
          <div class="row g-2 align-items-end mb-2">
            <div class="col-md-5">
              <label class="form-label" i18n>Name</label>
              <input type="text" class="form-control"
                     [ngModel]="row.name" name="cn-{{ i }}"
                     (ngModelChange)="patchCustom(i, { name: $event })">
            </div>
            <div class="col-md-3">
              <label class="form-label" i18n>Points</label>
              <input type="number" class="form-control"
                     [ngModel]="row.points" name="cp-{{ i }}"
                     (ngModelChange)="patchCustom(i, { points: $event })">
            </div>
            <div class="col-md-3">
              <label class="form-label" i18n>Count</label>
              <input type="number" min="1" class="form-control"
                     [ngModel]="row.count" name="cc-{{ i }}"
                     (ngModelChange)="patchCustom(i, { count: $event })">
            </div>
            <div class="col-md-1">
              <button type="button" class="btn btn-outline-danger btn-sm"
                      (click)="removeCustomRow(i)" aria-label="Remove">×</button>
            </div>
          </div>
        }
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="cancel()" i18n>Cancel</button>
      <button type="button" class="btn btn-primary" (click)="save()" i18n>Save</button>
    </div>
  `,
})
export class RaceResultModalComponent {
  protected readonly modal = inject(NgbActiveModal);

  // Options are injected via Object.assign by RaceResultModalService.open.
  drivers: Driver[] = [];
  existingResults: RaceResult[] = [];
  initial: RaceResult | null = null;

  // Form fields (template-driven for compactness).
  protected driverId = '';
  protected finishPos: number | null = null;
  protected gridPos: number | null = null;
  protected bestLap = '';
  protected isDsq = false;
  protected comments = '';

  protected readonly standardPenalties = STANDARD_PENALTIES;
  protected readonly standardCounts = signal<Array<number | null>>(
    STANDARD_PENALTIES.map(() => null),
  );
  protected readonly customRows = signal<CustomRow[]>([]);
  protected readonly errors = signal<{
    driver?: string; finish?: string; grid?: string; bestLap?: string;
  }>({});

  protected isEdit(): boolean { return !!this.initial?.id; }

  /** Called by `RaceResultModalService` after `Object.assign`-ing options. */
  hydrate(): void {
    const init = this.initial;
    if (init) {
      this.driverId = init.driver_id;
      this.finishPos = init.finish_position;
      this.gridPos = init.grid_start_position ?? null;
      this.bestLap = init.best_lap_time ?? '';
      this.isDsq = !!init.is_disqualified;
      this.comments = init.comments ?? '';
      // Pre-fill standard counts and custom rows from initial.penalties.
      const stdCounts = STANDARD_PENALTIES.map((sp) => {
        const found = (init.penalties ?? []).find((p) => p.penalty_type === sp.type);
        return found ? found.count : null;
      });
      this.standardCounts.set(stdCounts);
      const custom: CustomRow[] = (init.penalties ?? [])
        .filter((p) => p.penalty_type === 'custom')
        .map((p) => ({ name: p.penalty_name, points: p.point_deduction, count: p.count }));
      this.customRows.set(custom);
    }
  }

  protected isDriverDisabled(driverId: string): boolean {
    // Disable drivers already on the result list — except the one being edited.
    const used = this.existingResults.some((r) => r.driver_id === driverId);
    if (!used) return false;
    if (this.initial && this.initial.driver_id === driverId) return false;
    return true;
  }

  protected setStandardCount(i: number, value: number | string | null): void {
    const next = [...this.standardCounts()];
    const parsed = value === '' || value === null || value === undefined ? null : Number(value);
    next[i] = Number.isFinite(parsed) ? (parsed as number) : null;
    this.standardCounts.set(next);
  }

  protected addCustomRow(): void {
    this.customRows.set([...this.customRows(), { name: '', points: null, count: null }]);
  }
  protected removeCustomRow(i: number): void {
    this.customRows.set(this.customRows().filter((_, idx) => idx !== i));
  }
  protected patchCustom(i: number, patch: Partial<CustomRow>): void {
    const next = [...this.customRows()];
    next[i] = { ...next[i], ...patch };
    this.customRows.set(next);
  }

  protected save(): void {
    const errs: { driver?: string; finish?: string; grid?: string; bestLap?: string } = {};
    if (!isRequired(this.driverId)) errs.driver = $localize`Driver is required.`;
    if (!isPositiveInteger(this.finishPos)) errs.finish = $localize`Finish position must be a positive integer.`;
    if (this.gridPos !== null && this.gridPos !== undefined && String(this.gridPos) !== '' && !isPositiveInteger(this.gridPos)) {
      errs.grid = $localize`Grid start must be a positive integer.`;
    }
    if (this.bestLap && !isValidLapTime(this.bestLap)) {
      errs.bestLap = $localize`Lap time must be MM:SS.mmm or HH:MM:SS.mmm.`;
    }
    this.errors.set(errs);
    if (Object.keys(errs).length > 0) return;

    const penalties: RaceResultModalPayload['penalties'] = [];
    this.standardCounts().forEach((count, i) => {
      if (count !== null && Number.isFinite(count) && (count as number) > 0) {
        const sp = STANDARD_PENALTIES[i];
        penalties.push({
          penalty_type: sp.type,
          penalty_name: sp.name,
          point_deduction: sp.points,
          count: count as number,
        });
      }
    });
    this.customRows().forEach((row) => {
      const name = row.name.trim();
      const points = Number(row.points);
      const count = Number(row.count);
      if (name && Number.isFinite(points) && Number.isFinite(count) && count > 0) {
        penalties.push({
          penalty_type: 'custom',
          penalty_name: name,
          point_deduction: points,
          count,
        });
      }
    });

    const payload: RaceResultModalPayload = {
      id: this.initial?.id ?? null,
      driver_id: this.driverId,
      finish_position: Number(this.finishPos),
      grid_start_position: this.gridPos === null || (this.gridPos as unknown) === '' ? null : Number(this.gridPos),
      best_lap_time: this.bestLap.trim() ? this.bestLap.trim() : null,
      is_disqualified: this.isDsq,
      comments: this.comments.trim() ? this.comments.trim() : null,
      penalties,
    };
    this.modal.close(payload);
  }

  protected cancel(): void { this.modal.dismiss(null); }
}

@Injectable({ providedIn: 'root' })
export class RaceResultModalService {
  private readonly ngb = inject(NgbModal);

  async open(options: RaceResultModalOptions): Promise<RaceResultModalPayload | null> {
    const ref = this.ngb.open(RaceResultModalComponent, {
      backdrop: 'static', keyboard: false, size: 'lg', centered: true,
    });
    const instance = ref.componentInstance as RaceResultModalComponent;
    instance.drivers = options.drivers;
    instance.existingResults = options.existingResults;
    instance.initial = options.initial ?? null;
    instance.hydrate();
    try {
      const result = await ref.result;
      return (result as RaceResultModalPayload) ?? null;
    } catch {
      return null;
    }
  }
}
