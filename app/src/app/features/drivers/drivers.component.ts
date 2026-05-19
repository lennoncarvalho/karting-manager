import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { LoadingService } from '../../core/loading.service';
import type { Driver } from '../../core/models';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { DriverImageComponent } from '../../shared/kt-driver-image/kt-driver-image.component';
import { FormErrorComponent } from '../../shared/kt-form-error/kt-form-error.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';

type DriverForm = {
  id?: string;
  email: string; name: string; nickname?: string | null;
  birth_date?: string | null; sex?: string | null; blood_type?: string | null;
  weight?: number | null; picture_url?: string | null;
};

@Component({
  selector: 'kt-drivers',
  standalone: true,
  imports: [FormsModule, ButtonComponent, DriverImageComponent, FormErrorComponent, EmptyStateComponent],
  templateUrl: './drivers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversComponent {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  private readonly confirm = inject(ConfirmDialogService);

  protected readonly drivers = signal<Driver[]>([]);
  protected readonly editing = signal<DriverForm | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() { void this.load(); }

  private async load(): Promise<void> {
    this.error.set(null);
    try { this.drivers.set(await this.loading.track(this.api.listDrivers())); }
    catch (e) { this.error.set((e as Error).message); }
  }

  protected start(d?: Driver): void {
    this.error.set(null);
    this.editing.set(d ? { ...d } as DriverForm : { email: '', name: '' });
  }
  protected cancel(): void { this.editing.set(null); this.error.set(null); }

  protected async save(form: NgForm): Promise<void> {
    if (form.invalid) return;
    const f = this.editing();
    if (!f) return;
    this.error.set(null);
    try {
      const { id, ...rest } = f;
      const payload = { ...rest, weight: f.weight ?? null };
      const saved = id
        ? await this.loading.track(this.api.updateDriver(id, payload))
        : await this.loading.track(this.api.createDriver(payload));
      const list = [...this.drivers()];
      const idx = list.findIndex((x) => x.id === saved.id);
      if (idx >= 0) list[idx] = saved; else list.push(saved);
      list.sort((a, b) => a.name.localeCompare(b.name));
      this.drivers.set(list);
      this.editing.set(null);
    } catch (e) { this.error.set((e as Error).message); }
  }

  protected async remove(d: Driver): Promise<void> {
    const ok = await this.confirm.open({
      title: $localize`Delete driver?`,
      message: $localize`Delete "${d.name}"? Their race results will be deleted too (cascade).`,
      confirmVariant: 'danger', confirmText: $localize`Delete`,
    });
    if (!ok) return;
    try {
      await this.loading.track(this.api.deleteDriver(d.id));
      this.drivers.set(this.drivers().filter((x) => x.id !== d.id));
    } catch (e) { this.error.set((e as Error).message); }
  }
}
