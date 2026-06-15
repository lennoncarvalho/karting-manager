import * as Sentry from "@sentry/react";

// Initialize Sentry error capture / performance monitoring.
// Mirrors frontend/src/main.js Sentry setup but uses @sentry/react.
// Env vars (Vite): VITE_SENTRY_DSN, VITE_SENTRY_ENVIRONMENT.
// Gated on a real DSN so dev builds without credentials stay silent.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.httpClientIntegration(),
      Sentry.captureConsoleIntegration({ levels: ["error"] }),
    ],
    // Performance monitoring — capture all transactions in non-prod, sample in prod.
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    // Session Replay sampling — 10% of sessions, 100% on error.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
