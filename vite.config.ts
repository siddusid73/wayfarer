// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        // Use Leaflet's ESM build so the app and @maplibre/maplibre-gl-leaflet
        // share one module instance (the CJS build breaks the plugin's imports).
        // Exact match only, so "leaflet/dist/leaflet.css" still resolves.
        { find: /^leaflet$/, replacement: "leaflet/dist/leaflet-src.esm.js" },
      ],
    },
    optimizeDeps: {
      exclude: ["leaflet", "@maplibre/maplibre-gl-leaflet"],
    },
  },
});
