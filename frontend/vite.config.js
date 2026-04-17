import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
    sourcemap: true,
    rollupOptions: {
      input: 'index.html',
    },
  },

  plugins: [sentryVitePlugin({
    org: "lennon-carvalho",
    project: "javascript"
  }), sentryVitePlugin({
    org: "lennon-carvalho",
    project: "javascript"
  })]
});
