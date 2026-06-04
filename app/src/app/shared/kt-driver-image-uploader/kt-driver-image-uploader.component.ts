import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import { SupabaseService } from '../../core/supabase.service';
import { DriverImageComponent } from '../kt-driver-image/kt-driver-image.component';

/**
 * Driver picture uploader.
 *
 * Drop-in replacement for the previous `<input type="url">` field on
 * the drivers form. Renders the current image (via `<kt-driver-image>`
 * for the fallback avatar) and a file input that uploads to a Supabase
 * Storage bucket and emits the resulting public URL through the
 * two-way bindable `value` model.
 *
 * Inputs:
 *   - `bucket`  Supabase Storage bucket name. Default: `driver-pictures`.
 *   - `name`    Driver name — used by the fallback `<kt-driver-image>`.
 *
 * Two-way:
 *   - `value`   Current public URL of the picture (`string | null`).
 */
@Component({
  selector: 'kt-driver-image-uploader',
  standalone: true,
  imports: [DriverImageComponent],
  templateUrl: './kt-driver-image-uploader.component.html',
  styleUrl: './kt-driver-image-uploader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverImageUploaderComponent {
  private readonly supa = inject(SupabaseService);

  readonly value = model<string | null>(null);
  readonly bucket = input<string>('driver-pictures');
  readonly name = input<string>('');

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Always reset the input so re-selecting the same file fires `change`.
    input.value = '';
    if (!file) return;

    this.error.set(null);
    this.busy.set(true);
    try {
      const url = await this.upload(file);
      this.value.set(url);
    } catch (err) {
      this.error.set(SupabaseService.humanize(err as { message?: string; code?: string }));
    } finally {
      this.busy.set(false);
    }
  }

  protected clear(): void {
    this.value.set(null);
    this.error.set(null);
  }

  private async upload(file: File): Promise<string> {
    const bucket = this.bucket();
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `drivers/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await this.supa.client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
    if (uploadError) throw uploadError;

    const { data } = this.supa.client.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error('Upload succeeded but the public URL could not be resolved.');
    }
    return data.publicUrl;
  }
}
