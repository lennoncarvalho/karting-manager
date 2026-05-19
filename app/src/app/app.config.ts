import {
  ApplicationConfig,
  ErrorHandler,
  provideExperimentalZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/error.handler';
import { AuthStore } from './core/auth.store';
import { SeasonStore } from './core/season.store';

/**
 * App-wide providers. Standalone bootstrap entry point.
 *
 * - Zoneless change detection (signals only).
 * - Functional router with component-input binding for route params.
 * - HttpClient using fetch.
 * - APP_INITIALIZER hydrates auth + season caches before first render
 *   (route-level prefetch requested by the user — see spec §4 §6).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimations(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(async () => {
      const auth = inject(AuthStore);
      const seasons = inject(SeasonStore);
      await auth.restoreSession();
      // Prefetch seasons + select the persisted or current ongoing season.
      // Failures are swallowed (offline boot still works).
      try {
        await seasons.bootstrap();
      } catch {
        /* noop */
      }
    }),
  ],
};
