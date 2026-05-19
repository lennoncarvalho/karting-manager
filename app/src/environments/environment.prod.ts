export const environment = {
  production: true,
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR-ANON-PUBLIC-KEY',
  azureVisionEndpoint: '',
  azureVisionKey: '',
  sentryDsn: '',
  appUrl: 'https://kartarados.example.com',
  defaultLocale: 'pt-BR',
  availableLocales: ['pt-BR', 'en'] as const,
};

export type AppEnvironment = typeof environment;
