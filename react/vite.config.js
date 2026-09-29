import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Upload sourcemaps to Sentry only when an auth token is available
// (e.g. CI / production builds). Dev builds stay token-free.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  plugins: [
    react(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG || "lennon-carvalho",
            project: process.env.SENTRY_PROJECT || "javascript-react",
            authToken: sentryAuthToken,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 8000,
    host: "localhost",
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Vite 8 (rolldown) uses its native minifier by default.
    // Required for Sentry to symbolicate stack traces in production.
    sourcemap: true,
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) only supports function-form manualChunks.
        manualChunks(id) {
          const match = id.match(/node_modules\/((@[^/]+\/)?[^/]+)/);
          if (!match) return;
          const pkg = match[1];
          if (
            pkg === "react" ||
            pkg === "react-dom" ||
            pkg === "react-router" ||
            pkg === "react-router-dom"
          ) {
            return "vendor";
          }
          if (pkg === "bootstrap") return "bootstrap";
          if (pkg === "@sentry/react") return "sentry";
          if (pkg === "react-i18next" || pkg === "i18next") return "i18n";
        },
      },
    },
  },
});
