import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { LoadingService } from '../../core/loading.service';
import type { Driver, Race, RaceResult } from '../../core/models';
import { matchDriverName } from '../../core/ocr-matching';
import { detectSheetType, parseOcrRows, type ParsedRow, type SheetType } from '../../core/ocr-parsing';
import { OcrService } from '../../core/ocr.service';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';
import { isValidLapTime } from '../../shared/validators';
import { readJson, writeJson, remove as removeStorage } from '../../core/storage.util';

const DRAFT_PREFIX = 'ocrImportDraft:';

interface ReviewRow {
  position: number;
  name: string;
  bestLapTime: string | null;
  driverId: string | null;
  skip: boolean;
}

interface DraftV1 {
  mode: SheetType;
  rows: ReviewRow[];
  text: string;
}

/**
 * OCR import flow — port of v1 `OcrImportModal.js` as an Angular page
 * mounted at `/admin/ocr-import?raceId=…`.
 *
 * Flow: upload image → run OCR (Azure → Tesseract fallback via
 * {@link OcrService}) → detect sheet type → parse rows → auto-match
 * drivers → operator-reviewable table → persist via {@link ApiService}.
 *
 * Differences from v1 (intentional, smaller scope):
 *   - Crop/enhance/threshold canvas tooling is omitted; operators can
 *     pre-crop the image client-side. The plumbing for `OcrService` is
 *     identical so adding this back is purely additive UI work.
 *   - Provider banner shows whichever provider actually ran.
 *   - Draft is persisted under the same `ocrImportDraft:<raceId>` key
 *     as v1 to keep cross-version draft compatibility.
 */
@Component({
  selector: 'kt-ocr-import',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './ocr-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrImportComponent {
  private readonly api = inject(ApiService);
  private readonly ocr = inject(OcrService);
  private readonly loading = inject(LoadingService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly route = inject(ActivatedRoute);

  // ── Inputs from the URL query string ─────────────────────────────────
  protected readonly raceId = signal<string | null>(
    this.route.snapshot.queryParamMap.get('raceId'),
  );

  // ── Local state ──────────────────────────────────────────────────────
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly race = signal<Race | null>(null);
  protected readonly existingResults = signal<RaceResult[]>([]);
  protected readonly mode = signal<SheetType>('race');
  protected readonly rows = signal<ReviewRow[]>([]);
  protected readonly status = signal<string>('idle');
  protected readonly providerLabel = signal<string>('');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal<boolean>(false);
  protected readonly selectedFile = signal<File | null>(null);

  protected readonly hasResults = computed(() => this.existingResults().length > 0);

  /** Gate warning: `'race'` is blocked when results exist; `'qualifying'` when none exist. */
  protected readonly gateWarning = computed<string | null>(() => {
    if (this.mode() === 'race' && this.hasResults()) {
      return $localize`This race already has results — switch to qualifying or clear them first.`;
    }
    if (this.mode() === 'qualifying' && !this.hasResults()) {
      return $localize`Qualifying import requires existing race results to attach lap times to.`;
    }
    return null;
  });

  protected readonly canSave = computed(
    () => !this.busy() && this.rows().length > 0 && this.gateWarning() === null,
  );

  constructor() {
    queueMicrotask(() => void this.load());
  }

  private get draftKey(): string {
    return `${DRAFT_PREFIX}${this.raceId() ?? 'unknown'}`;
  }

  private async load(): Promise<void> {
    this.error.set(null);
    try {
      const id = this.raceId();
      const [drivers, race, results] = await Promise.all([
        this.api.listDrivers(),
        id ? this.api.getRace(id) : Promise.resolve(null),
        id ? this.api.listRaceResults(id) : Promise.resolve([] as RaceResult[]),
      ]);
      this.drivers.set(drivers);
      this.race.set(race);
      this.existingResults.set(results);
      // Restore prior draft (if any).
      const draft = readJson<DraftV1>(this.draftKey);
      if (draft) {
        this.mode.set(draft.mode);
        this.rows.set(draft.rows ?? []);
        if (draft.rows?.length) this.status.set('ready');
      }
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  protected onModeChange(value: SheetType): void {
    this.mode.set(value);
    this.persistDraft();
  }

  protected async runOcr(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.error.set($localize`Choose an image first.`);
      return;
    }
    if (this.gateWarning()) {
      this.error.set(this.gateWarning());
      return;
    }
    this.error.set(null);
    this.busy.set(true);
    this.status.set('running');
    try {
      const res = await this.loading.track(this.ocr.run(file));
      this.providerLabel.set(`${res.provider}${res.fallbackUsed ? ' (fallback)' : ''}`);

      // Sheet-type detection: if it disagrees with the selected mode, ask.
      const detected = detectSheetType(res.text);
      if (detected && detected !== this.mode()) {
        const keep = await this.confirm.open({
          title: $localize`Sheet type mismatch`,
          message: $localize`The image looks like a ${detected} sheet but the selected mode is ${this.mode()}. Keep your selection?`,
          confirmText: $localize`Keep selection`,
          cancelText: $localize`Use detected`,
        });
        if (!keep) this.mode.set(detected);
      }

      this.status.set('parsing');
      const parsed = parseOcrRows({ text: res.text, tables: res.tables as never });
      const reviewRows = this.applyMatches(parsed);
      this.rows.set(reviewRows);
      this.status.set(reviewRows.length ? 'ready' : 'no-rows');
      this.persistDraft(res.text);
    } catch (e) {
      this.error.set((e as Error).message);
      this.status.set('idle');
    } finally {
      this.busy.set(false);
    }
  }

  private applyMatches(parsed: ParsedRow[]): ReviewRow[] {
    const drivers = this.drivers();
    return parsed.map((row) => {
      const match = matchDriverName(row.name, drivers);
      return {
        position: row.position,
        name: row.name,
        bestLapTime: isValidLapTime(row.bestLapTime) ? row.bestLapTime : null,
        driverId: match.best ? match.best.id : null,
        skip: false,
      };
    });
  }

  protected patchRow(index: number, patch: Partial<ReviewRow>): void {
    const next = [...this.rows()];
    next[index] = { ...next[index], ...patch };
    this.rows.set(next);
    this.persistDraft();
  }

  private persistDraft(text?: string): void {
    if (!this.raceId()) return;
    const existing = readJson<DraftV1>(this.draftKey);
    const draft: DraftV1 = {
      mode: this.mode(),
      rows: this.rows(),
      text: text ?? existing?.text ?? '',
    };
    writeJson(this.draftKey, draft);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    const id = this.raceId();
    if (!id) {
      this.error.set($localize`Missing raceId — open this page from a race detail.`);
      return;
    }
    const selected = this.rows().filter((r) => !r.skip && r.driverId);
    const unresolved = this.rows().filter((r) => !r.skip && !r.driverId);
    if (unresolved.length) {
      this.error.set($localize`Some rows have no driver match — pick one or check Skip.`);
      return;
    }
    if (!selected.length) {
      this.error.set($localize`No rows selected — review the table.`);
      return;
    }
    // Duplicate driver guard
    const seen = new Set<string>();
    for (const r of selected) {
      if (seen.has(r.driverId!)) {
        this.error.set($localize`Two rows reference the same driver — fix or skip.`);
        return;
      }
      seen.add(r.driverId!);
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      if (this.mode() === 'race') {
        // Create new race_results rows.
        for (const row of selected) {
          await this.api.createRaceResult({
            race_id: id,
            driver_id: row.driverId!,
            finish_position: row.position,
            best_lap_time: row.bestLapTime,
            is_disqualified: false,
            comments: null,
          });
        }
      } else {
        // Qualifying: patch existing race_results for matched drivers with
        // grid_start_position + (optionally) best_lap_time. Skip rows
        // whose driver has no existing result.
        const existingByDriver = new Map(this.existingResults().map((r) => [r.driver_id, r]));
        for (const row of selected) {
          const existing = existingByDriver.get(row.driverId!);
          if (!existing) continue;
          await this.api.updateRaceResult(existing.id, {
            grid_start_position: row.position,
            best_lap_time: row.bestLapTime ?? existing.best_lap_time ?? null,
          });
        }
      }
      removeStorage(this.draftKey);
      this.status.set('saved');
      this.rows.set([]);
      // Re-fetch existing results so the gate updates correctly if user
      // wants to immediately import another sheet.
      this.existingResults.set(await this.api.listRaceResults(id));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
