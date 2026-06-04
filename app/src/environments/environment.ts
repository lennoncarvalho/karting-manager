// Default (development) environment.
//
// Replace the placeholder values with your real Supabase project. For
// production builds Angular swaps this file with `environment.prod.ts`
// via the `fileReplacements` in `angular.json` (add it there if you keep
// two separate files).
//
// Reading from a `.env` requires a custom loader; the simplest option is
// to commit dummy values here and override them per environment in CI
// (e.g. Cloudflare Pages "Environment variables" + a small prebuild
// `node scripts/inject-env.mjs` that rewrites this file).

export const environment = {
  production: false,
  supabaseUrl: 'https://pallvdbokvjzctjfntuq.supabase.co',
  supabaseAnonKey: 'sb_publishable_mv_q4LZt5xHqfGL582Uoqw_01KcjSLy',
  azureVisionEndpoint: 'https://karting-manager-docs.cognitiveservices.azure.com/',
  azureVisionKey: '6WgfHfqMW9NzmxnmAgCI6K1UzzhSydt5MMAE714MF1e5SZ9bcrw5JQQJ99CBACZoyfiXJ3w3AAALACOGs0EN',
  sentryDsn: 'https://3efc6f6e8dbe73276774b32ea9541ec2@o4511237273944064.ingest.us.sentry.io/4511237276696576',
  appUrl: 'http://localhost:4200',
  defaultLocale: 'pt-BR',
  availableLocales: ['pt-BR', 'en'] as const,
};

export type AppEnvironment = typeof environment;
