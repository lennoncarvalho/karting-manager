import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { SeasonStore } from '../../core/season.store';
import { LoadingService } from '../../core/loading.service';
import type { Cup, Race } from '../../core/models';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { FormErrorComponent } from '../../shared/kt-form-error/kt-form-error.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { SkeletonRowComponent } from '../../shared/kt-skeleton-row/kt-skeleton-row.component';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';

type RaceForm = {
  id?: string; name: string; location: string;
  race_datetime: string; cup_id?: string | null;
  affects_championship: boolean;
};

function emptyRaceForm(): RaceForm {
  return { name: '', location: '', race_datetime: '', cup_id: null, affects_championship: true };
}

@Component({
  selector: 'kt-races',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonComponent, FormErrorComponent, EmptyStateComponent, SkeletonRowComponent, DateTimePipe],
  templateUrl: './races.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacesComponent {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  private readonly confirm = inject(ConfirmDialogService);
  protected readonly store = inject(SeasonStore);

  protected readonly races = signal<Race[]>([]);
  protected readonly cups = signal<Cup[]>([]);
  protected readonly form = signal<RaceForm>(emptyRaceForm());
  protected readonly isEditing = signal(false);
  protected readonly busy = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly seasonId = computed(() => this.store.selectedSeasonId());

  constructor() {
    effect(() => {
      const sid = this.seasonId();
      if (sid) void this.load(sid);
      else { this.races.set([]); this.cups.set([]); }
    });
  }

  private async load(seasonId: string): Promise<void> {
    this.error.set(null);
    this.loadingList.set(true);
    try {
      const [races, cups] = await Promise.all([
        this.loading.track(this.api.listRaces({ seasonId })),
        this.api.listCups(seasonId),
      ]);
      this.races.set(races); this.cups.set(cups);
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.loadingList.set(false); }
  }

  protected edit(r: Race): void {
    this.error.set(null);
    this.form.set({
      id: r.id, name: r.name, location: r.location,
      race_datetime: r.race_datetime.slice(0, 16),
      cup_id: r.cup_id ?? null, affects_championship: r.affects_championship,
    });
    this.isEditing.set(true);
  }

  protected reset(): void {
    this.form.set(emptyRaceForm());
    this.isEditing.set(false);
    this.error.set(null);
  }

  /** Generic field setter used by the template (Angular templates disallow arrow fns). */
  protected setField<K extends keyof RaceForm>(key: K, value: RaceForm[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected async save(ngForm: NgForm): Promise<void> {
    if (ngForm.invalid) return;
    const f = this.form();
    const sid = this.seasonId();
    if (!sid) return;
    this.error.set(null);
    this.busy.set(true);
    try {
      const payload = {
        name: f.name, location: f.location,
        race_datetime: new Date(f.race_datetime).toISOString(),
        cup_id: f.cup_id || null, season_id: sid,
        affects_championship: f.affects_championship,
      };
      const saved = f.id
        ? await this.loading.track(this.api.updateRace(f.id, payload))
        : await this.loading.track(this.api.createRace(payload));
      const list = [...this.races()];
      const idx = list.findIndex((x) => x.id === saved.id);
      if (idx >= 0) list[idx] = saved; else list.push(saved);
      list.sort((a, b) => a.race_datetime.localeCompare(b.race_datetime));
      this.races.set(list);
      this.reset();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }

  protected async remove(r: Race): Promise<void> {
    const ok = await this.confirm.open({
      title: $localize`Delete race?`,
      message: $localize`Delete "${r.name}"? Results and penalties will be deleted (cascade).`,
      confirmVariant: 'danger', confirmText: $localize`Delete`,
    });
    if (!ok) return;
    try {
      await this.loading.track(this.api.deleteRace(r.id));
      this.races.set(this.races().filter((x) => x.id !== r.id));
      if (this.form().id === r.id) this.reset();
    } catch (e) { this.error.set((e as Error).message); }
  }
}
