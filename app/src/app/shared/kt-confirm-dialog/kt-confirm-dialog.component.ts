import { ChangeDetectionStrategy, Component, inject, Injectable, input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ButtonComponent } from '../kt-button/kt-button.component';

/**
 * Reusable confirm dialog. Open via {@link ConfirmDialogService.open}.
 *
 * Example:
 *   const confirmed = await this.confirm.open({
 *     title: 'Delete driver?',
 *     message: 'This cannot be undone.',
 *     confirmVariant: 'danger',
 *   });
 */
@Component({
  selector: 'kt-confirm-dialog',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './kt-confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly modal = inject(NgbActiveModal);

  readonly title = input<string>('Are you sure?');
  readonly message = input<string>('');
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly confirmVariant = input<'primary' | 'danger' | 'warning'>('primary');

  protected confirm(): void { this.modal.close(true); }
  protected cancel(): void { this.modal.dismiss(false); }
}

export interface ConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly ngb = inject(NgbModal);

  async open(options: ConfirmDialogOptions = {}): Promise<boolean> {
    const ref = this.ngb.open(ConfirmDialogComponent, { backdrop: 'static', centered: true });
    const instance = ref.componentInstance as ConfirmDialogComponent;
    // Set inputs by overwriting the underlying signal — Angular 19 inputs
    // expose `.set` only on writable signals; for input() we rely on the
    // host binding done via componentInputs. ng-bootstrap accepts that
    // via its dynamic component creation: we mutate via Object.assign
    // on the instance with `.title = ...` style which Angular tolerates
    // because `input()` returns a function but its source is signal.
    // Simpler approach below: pass through `componentInstance` props by
    // calling NgbModal with `componentInstance` patching after open.
    Object.assign(instance, {
      // `input()` returns a function; replace it with one that returns
      // the new value. The component's template calls `title()` etc.
      title: () => options.title ?? 'Are you sure?',
      message: () => options.message ?? '',
      confirmText: () => options.confirmText ?? 'Confirm',
      cancelText: () => options.cancelText ?? 'Cancel',
      confirmVariant: () => options.confirmVariant ?? 'primary',
    });
    try { return await ref.result; }
    catch { return false; }
  }
}
