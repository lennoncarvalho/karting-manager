import { Injectable, computed, signal } from '@angular/core';

/**
 * Global in-flight counter. Components increment via `track()` (or the
 * `[ktAsyncClick]` directive / `kt-button[loading]`); the global
 * `kt-loading-overlay` reads `isLoading` and shows a spinner.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly inFlight = signal(0);
  readonly isLoading = computed(() => this.inFlight() > 0);

  start(): void { this.inFlight.update((n) => n + 1); }
  stop(): void { this.inFlight.update((n) => Math.max(0, n - 1)); }

  /** Wrap a promise so the spinner shows for its lifetime. */
  async track<T>(promise: Promise<T>): Promise<T> {
    this.start();
    try { return await promise; } finally { this.stop(); }
  }
}
