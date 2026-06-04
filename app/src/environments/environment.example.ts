// Template for the development environment.
//
// Copy this file to `environment.ts` and fill in the real values for
// your local development. `environment.ts` is git-ignored to prevent
// committing secrets (Supabase keys, Azure Vision keys, Sentry DSN,
// etc.) — only this example template is versioned.
//
// For production builds Angular swaps `environment.ts` with
// `environment.prod.ts` via `fileReplacements` in `angular.json`.
// In CI, generate `environment.ts` from environment variables (e.g.
// a small prebuild `node scripts/inject-env.mjs`).

export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR-ANON-PUBLIC-KEY',
  azureVisionEndpoint: 'https://YOUR-RESOURCE.cognitiveservices.azure.com/',
  azureVisionKey: 'YOUR-AZURE-VISION-KEY',
  sentryDsn: '',
  appUrl: 'http://localhost:4200',
  defaultLocale: 'pt-BR',
  availableLocales: ['pt-BR', 'en'] as const,
};

export type AppEnvironment = typeof environment;
