import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Upload sourcemaps to Sentry only when an auth token is available
// (e.g. CI / production builds). Dev builds stay token-free.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  plugins: [
    react(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG || 'lennon-carvalho',
            project: process.env.SENTRY_PROJECT || 'javascript-react',
            authToken: sentryAuthToken,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 8000,
    host: 'localhost',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    // Required for Sentry to symbolicate stack traces in production.
    sourcemap: true,
  },
});
