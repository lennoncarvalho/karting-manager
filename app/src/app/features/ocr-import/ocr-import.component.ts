import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { OcrService } from '../../core/ocr.service';
import { LoadingService } from '../../core/loading.service';

/**
 * Foundation for the OCR import flow. The full parser, driver-matching
 * heuristics, and the multi-step modal from v1
 * (`frontend/src/components/OcrImportModal.js`, 648 lines) still need
 * to be ported — see `IMPLEMENTATION-STATUS.md` §6.6.
 *
 * This component currently:
 *  - lets you upload one image,
 *  - calls Azure Document Intelligence (or Tesseract `por` fallback),
 *  - shows the extracted raw text so the operator can validate the OCR
 *    provider end-to-end on production data before the full UI lands.
 */
@Component({
  selector: 'kt-ocr-import',
  standalone: true,
  imports: [],
  templateUrl: './ocr-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrImportComponent {
  private readonly ocr = inject(OcrService);
  private readonly loading = inject(LoadingService);

  protected readonly result = signal<string>('');
  protected readonly provider = signal<string>('');
  protected readonly error = signal<string | null>(null);

  protected async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set(null);
    this.result.set(''); this.provider.set('');
    try {
      const res = await this.loading.track(this.ocr.run(file));
      this.result.set(res.text);
      this.provider.set(`${res.provider}${res.fallbackUsed ? ' (fallback)' : ''}`);
    } catch (e) { this.error.set((e as Error).message); }
    finally { input.value = ''; }
  }
}
