import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { SeasonStore } from '../../core/season.store';
import { LoadingService } from '../../core/loading.service';
import type { Cup } from '../../core/models';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { FormErrorComponent } from '../../shared/kt-form-error/kt-form-error.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';

type CupForm = { id?: string; name: string; start_date: string; end_date: string };

@Component({
  selector: 'kt-cups',
  standalone: true,
  imports: [FormsModule, ButtonComponent, FormErrorComponent, EmptyStateComponent],
  templateUrl: './cups.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CupsComponent {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  private readonly confirm = inject(ConfirmDialogService);
  protected readonly store = inject(SeasonStore);

  protected readonly cups = signal<Cup[]>([]);
  protected readonly editing = signal<CupForm | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly seasonId = computed(() => this.store.selectedSeasonId());

  constructor() {
    effect(() => {
      const sid = this.seasonId();
      if (sid) void this.load(sid);
      else this.cups.set([]);
    });
  }

  private async load(seasonId: string): Promise<void> {
    this.error.set(null);
    try { this.cups.set(await this.loading.track(this.api.listCups(seasonId))); }
    catch (e) { this.error.set((e as Error).message); }
  }

  protected start(cup?: Cup): void {
    this.error.set(null);
    this.editing.set(cup
      ? { id: cup.id, name: cup.name, start_date: cup.start_date, end_date: cup.end_date }
      : { name: '', start_date: '', end_date: '' });
  }
  protected cancel(): void { this.editing.set(null); this.error.set(null); }

  protected async save(form: NgForm): Promise<void> {
    if (form.invalid) return;
    const f = this.editing();
    const sid = this.seasonId();
    if (!f || !sid) return;
    this.error.set(null);
    try {
      const payload = { name: f.name, start_date: f.start_date, end_date: f.end_date, season_id: sid };
      const saved = f.id
        ? await this.loading.track(this.api.updateCup(f.id, payload))
        : await this.loading.track(this.api.createCup(payload));
      const list = [...this.cups()];
      const idx = list.findIndex((c) => c.id === saved.id);
      if (idx >= 0) list[idx] = saved; else list.push(saved);
      list.sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''));
      this.cups.set(list);
      this.editing.set(null);
    } catch (e) { this.error.set((e as Error).message); }
  }

  protected async remove(c: Cup): Promise<void> {
    const ok = await this.confirm.open({
      title: $localize`Delete cup?`,
      message: $localize`Delete "${c.name}"? Races assigned to this cup will be detached.`,
      confirmVariant: 'danger', confirmText: $localize`Delete`,
    });
    if (!ok) return;
    try {
      await this.loading.track(this.api.deleteCup(c.id));
      this.cups.set(this.cups().filter((x) => x.id !== c.id));
    } catch (e) { this.error.set((e as Error).message); }
  }
}
