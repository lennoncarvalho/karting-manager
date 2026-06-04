import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { LoadingService } from '../../core/loading.service';
import type { Driver } from '../../core/models';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { DriverImageComponent } from '../../shared/kt-driver-image/kt-driver-image.component';
import { DriverImageUploaderComponent } from '../../shared/kt-driver-image-uploader/kt-driver-image-uploader.component';
import { FormErrorComponent } from '../../shared/kt-form-error/kt-form-error.component';
import { EmptyStateComponent } from '../../shared/kt-empty-state/kt-empty-state.component';
import { SkeletonRowComponent } from '../../shared/kt-skeleton-row/kt-skeleton-row.component';
import { ConfirmDialogService } from '../../shared/kt-confirm-dialog/kt-confirm-dialog.component';

type DriverForm = {
  id?: string;
  email: string; name: string; nickname?: string | null;
  birth_date?: string | null; sex?: string | null; blood_type?: string | null;
  weight?: number | null; picture_url?: string | null;
};

function emptyForm(): DriverForm {
  return { email: '', name: '', nickname: null, birth_date: null, weight: null, blood_type: null, picture_url: null };
}

@Component({
  selector: 'kt-drivers',
  standalone: true,
  imports: [
    FormsModule,
    ButtonComponent,
    DriverImageComponent,
    DriverImageUploaderComponent,
    FormErrorComponent,
    EmptyStateComponent,
    SkeletonRowComponent,
  ],
  templateUrl: './drivers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversComponent {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);
  private readonly confirm = inject(ConfirmDialogService);

  protected readonly drivers = signal<Driver[]>([]);
  /** Always-visible form model (v1 layout has form on the left, table on the right). */
  protected readonly form = signal<DriverForm>(emptyForm());
  protected readonly isEditing = signal(false);
  protected readonly busy = signal(false);
  protected readonly loadingList = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() { void this.load(); }

  private async load(): Promise<void> {
    this.error.set(null);
    this.loadingList.set(true);
    try { this.drivers.set(await this.loading.track(this.api.listDrivers())); }
    catch (e) { this.error.set((e as Error).message); }
    finally { this.loadingList.set(false); }
  }

  protected edit(d: Driver): void {
    this.error.set(null);
    this.form.set({ ...d } as DriverForm);
    this.isEditing.set(true);
  }

  protected reset(): void {
    this.form.set(emptyForm());
    this.isEditing.set(false);
    this.error.set(null);
  }

  /** Two-way binding helper for `<kt-driver-image-uploader [(value)]>`. */
  protected setPicture(url: string | null): void {
    this.form.update((f) => ({ ...f, picture_url: url }));
  }

  /** Generic field setter used by the template (Angular templates disallow arrow fns). */
  protected setField<K extends keyof DriverForm>(key: K, value: DriverForm[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected async save(ngForm: NgForm): Promise<void> {
    if (ngForm.invalid) return;
    const f = this.form();
    this.error.set(null);
    this.busy.set(true);
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
      this.reset();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
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
      if (this.form().id === d.id) this.reset();
    } catch (e) { this.error.set((e as Error).message); }
  }
}
