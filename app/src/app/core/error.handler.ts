import { ErrorHandler, Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';

import { environment } from '../../environments/environment';

/**
 * Catches uncaught Angular errors, forwards to Sentry (if configured),
 * and logs to the console. UI surface (toast) is up to feature code —
 * keep this handler quiet so it doesn't block render.
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (environment.sentryDsn) {
      Sentry.captureException(error);
    }
    // eslint-disable-next-line no-console
    console.error('[Kartarados]', error);
  }
}
