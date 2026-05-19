import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { SeasonStore } from '../../core/season.store';
import { LoadingService } from '../../core/loading.service';
import type { Season } from '../../core/models';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { FormErrorComponent } from '../../shared/kt-form-error/kt-form-error.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';

type SeasonForm = {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_ongoing: boolean;
  accent_color: string;
};

@Component({
  selector: 'kt-seasons',
  standalone: true,
  imports: [FormsModule, ButtonComponent, FormErrorComponent, EmptyStateComponent],
  templateUrl: './seasons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonsComponent {
  private readonly api = inject(ApiService);
  private readonly store = inject(SeasonStore);
  private readonly loading = inject(LoadingService);
  private readonly confirm = inject(ConfirmDialogService);

  protected readonly seasons = this.store.seasons;
  protected readonly editing = signal<SeasonForm | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    if (!this.seasons().length) void this.store.refresh();
  }

  protected start(season?: Season): void {
    this.error.set(null);
    this.editing.set(season
      ? { id: season.id, name: season.name, start_date: season.start_date,
          end_date: season.end_date, is_ongoing: season.is_ongoing,
          accent_color: season.accent_color }
      : { name: '', start_date: '', end_date: '', is_ongoing: false, accent_color: '#0d6efd' });
  }

  protected cancel(): void { this.editing.set(null); this.error.set(null); }

  protected async save(form: NgForm): Promise<void> {
    if (form.invalid) return;
    const f = this.editing();
    if (!f) return;
    this.error.set(null);
    try {
      const payload = {
        name: f.name, start_date: f.start_date, end_date: f.end_date,
        is_ongoing: f.is_ongoing, accent_color: f.accent_color,
      };
      const saved = f.id
        ? await this.loading.track(this.api.updateSeason(f.id, payload))
        : await this.loading.track(this.api.createSeason(payload));
      this.store.upsert(saved);
      this.editing.set(null);
    } catch (e) { this.error.set((e as Error).message); }
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
    } catch (e) { this.error.set((e as Error).message); }
  }
}
