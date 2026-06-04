import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { SeasonStore } from '../../core/season.store';
import { LoadingService } from '../../core/loading.service';
import type { Season } from '../../core/models';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { FormErrorComponent } from '../../shared/kt-form-error/kt-form-error.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { SkeletonRowComponent } from '../../shared/kt-skeleton-row/kt-skeleton-row.component';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';

type SeasonForm = {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_ongoing: boolean;
  accent_color: string;
};

function emptyForm(): SeasonForm {
  return { name: '', start_date: '', end_date: '', is_ongoing: false, accent_color: '#0d6efd' };
}

@Component({
  selector: 'kt-seasons',
  standalone: true,
  imports: [FormsModule, ButtonComponent, FormErrorComponent, EmptyStateComponent, SkeletonRowComponent],
  templateUrl: './seasons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonsComponent {
  private readonly api = inject(ApiService);
  private readonly store = inject(SeasonStore);
  private readonly loading = inject(LoadingService);
  private readonly confirm = inject(ConfirmDialogService);

  protected readonly seasons = this.store.seasons;
  protected readonly form = signal<SeasonForm>(emptyForm());
  protected readonly isEditing = signal(false);
  protected readonly busy = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    if (!this.seasons().length) {
      this.loadingList.set(true);
      void this.store.refresh().finally(() => this.loadingList.set(false));
    }
  }

  protected edit(season: Season): void {
    this.error.set(null);
    this.form.set({
      id: season.id, name: season.name, start_date: season.start_date,
      end_date: season.end_date, is_ongoing: season.is_ongoing,
      accent_color: season.accent_color,
    });
    this.isEditing.set(true);
  }

  protected reset(): void {
    this.form.set(emptyForm());
    this.isEditing.set(false);
    this.error.set(null);
  }

  /** Generic field setter used by the template (Angular templates disallow arrow fns). */
  protected setField<K extends keyof SeasonForm>(key: K, value: SeasonForm[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected async save(ngForm: NgForm): Promise<void> {
    if (ngForm.invalid) return;
    const f = this.form();
    this.error.set(null);
    this.busy.set(true);
    try {
      const payload = {
        name: f.name, start_date: f.start_date, end_date: f.end_date,
        is_ongoing: f.is_ongoing, accent_color: f.accent_color,
      };
      const saved = f.id
        ? await this.loading.track(this.api.updateSeason(f.id, payload))
        : await this.loading.track(this.api.createSeason(payload));
      this.store.upsert(saved);
      this.reset();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }

  protected async remove(s: Season): Promise<void> {
    const ok = await this.confirm.open({
      title: $localize`Delete season?`,
      message: $localize`This will delete the season "${s.name}" and cascade to its cups and races. This action cannot be undone.`,
      confirmVariant: 'danger', confirmText: $localize`Delete`,
    });
    if (!ok) return;
    try {
      await this.loading.track(this.api.deleteSeason(s.id));
      this.store.removeLocal(s.id);
      if (this.form().id === s.id) this.reset();
    } catch (e) { this.error.set((e as Error).message); }
  }
}
