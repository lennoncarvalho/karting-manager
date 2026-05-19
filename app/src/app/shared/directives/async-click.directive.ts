import { Directive, HostListener, inject, input } from '@angular/core';
import * as Sentry from '@sentry/angular';

import { LoadingService } from '../../core/loading.service';

/**
 * Wraps any element's click handler with the global LoadingService
 * counter. Use for non-button elements (icons, list rows). For buttons,
 * prefer `<kt-button [loading]="...">` because it shows the spinner.
 */
@Directive({
  selector: '[ktAsyncClick]',
  standalone: true,
  host: { '[attr.aria-busy]': 'busy ? "true" : null' },
})
export class AsyncClickDirective {
  private readonly loading = inject(LoadingService);
  protected busy = false;

  readonly ktAsyncClick = input.required<() => Promise<unknown> | unknown>();

  @HostListener('click')
  async onClick(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.loading.start();
    try { await this.ktAsyncClick()(); }
    catch (e) { Sentry.captureException(e); throw e; }
    finally { this.busy = false; this.loading.stop(); }
  }
}
