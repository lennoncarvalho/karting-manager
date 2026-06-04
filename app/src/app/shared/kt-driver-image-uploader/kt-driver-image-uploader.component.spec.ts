import { describe, expect, it, vi } from 'vitest';

import { SupabaseService } from '../../core/supabase.service';
import { DriverImageUploaderComponent } from './kt-driver-image-uploader.component';

/**
 * Sanity test for the uploader's URL emission. We bypass Angular's
 * dependency injection and construct the component class directly with
 * an overridden Supabase client, then call the protected file-change
 * handler via a casted reference.
 */
describe('DriverImageUploaderComponent — URL emission', () => {
  const PUBLIC_URL = 'https://supabase.test/storage/v1/object/public/driver-pictures/drivers/x.png';

  function makeFakeSupabase(): SupabaseService {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'drivers/x.png' }, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: PUBLIC_URL } });
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
    return { client: { storage: { from } } } as unknown as SupabaseService;
  }

  function makeFileEvent(): Event {
    const file = new File([new Uint8Array([0])], 'face.png', { type: 'image/png' });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file] });
    return { target: input } as unknown as Event;
  }

  it('uploads the selected file and emits the public URL via value model', async () => {
    const supa = makeFakeSupabase();

    // Construct without Angular DI by overriding the injected supa field.
    const cmp = Object.create(DriverImageUploaderComponent.prototype) as DriverImageUploaderComponent;
    (cmp as unknown as { supa: SupabaseService }).supa = supa;
    // Wire model + input signals as if Angular had created them.
    const valueRef = { v: null as string | null };
    (cmp as unknown as { value: { set: (s: string | null) => void; (): string | null } }).value =
      Object.assign((() => valueRef.v) as () => string | null, {
        set: (s: string | null) => { valueRef.v = s; },
      });
    (cmp as unknown as { bucket: () => string }).bucket = () => 'driver-pictures';
    (cmp as unknown as { name: () => string }).name = () => 'X';
    (cmp as unknown as { busy: { set: (b: boolean) => void } }).busy = { set: () => {} };
    (cmp as unknown as { error: { set: (s: string | null) => void } }).error = { set: () => {} };

    await (cmp as unknown as { onFileSelected: (e: Event) => Promise<void> }).onFileSelected(
      makeFileEvent(),
    );

    expect(valueRef.v).toBe(PUBLIC_URL);
    expect(
      (supa.client.storage.from as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
    ).toBeGreaterThan(0);
  });
});
