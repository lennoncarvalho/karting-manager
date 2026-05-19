import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePtBR from '@angular/common/locales/pt';
import localePtBRExtra from '@angular/common/locales/extra/pt';
import * as Sentry from '@sentry/angular';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

// Register pt-BR locale data so Angular's date/number pipes work and the
// build-time locale lookup stops falling back with a warning. Angular ships
// pt-BR under the generic `pt` dataset; we register it under the `pt-BR` id.
registerLocaleData(localePtBR, 'pt-BR', localePtBRExtra);

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    tracesSampleRate: environment.production ? 0.1 : 0,
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  Sentry.captureException(err);
});
