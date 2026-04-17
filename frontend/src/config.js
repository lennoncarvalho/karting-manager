/**
 * Application Configuration
 *
 * During the build step (production), environment variables are injected into this file
 * using the build.sh script. For local development, you can create a config.local.js file
 * (ignored by Git) to override these values.
 */

const localConfigs = import.meta.glob('./config.local.js', { eager: true });
const local = localConfigs['./config.local.js'] || {};

// Supabase Configuration
// Get these values from: Supabase Dashboard → Settings → API
export const APP_URL = local.APP_URL ?? 'https://karting-manager.pages.dev/';
export const SUPABASE_URL = local.SUPABASE_URL ?? '[SUPABASE_URL]';
export const SUPABASE_ANON_KEY = local.SUPABASE_ANON_KEY ?? '[SUPABASE_ANON_KEY]';
export const AZURE_VISION_ENDPOINT = local.AZURE_VISION_ENDPOINT ?? '[AZURE_VISION_ENDPOINT]';
export const AZURE_VISION_KEY = local.AZURE_VISION_KEY ?? '[AZURE_VISION_KEY]';

// Sentry Configuration
// Get these values from: Sentry Dashboard → Project Settings → Client Keys (DSN)
export const SENTRY_DSN = local.SENTRY_DSN ?? '[SENTRY_DSN]';
export const SENTRY_ENVIRONMENT = local.SENTRY_ENVIRONMENT ?? 'production';
export const SENTRY_AUTH_TOKEN = local.SENTRY_AUTH_TOKEN ?? '[SENTRY_AUTH_TOKEN]';

// CDN URLs for libraries
export const CDN_URLS = {
  bootstrap: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  bootstrapIcons: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  supabase: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
};