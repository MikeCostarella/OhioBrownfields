import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages project site: base MUST equal "/<RepoName>/" (case-sensitive).
// repo is github.com/MikeCostarella/OhioBrownfields -> served at /OhioBrownfields/
const BASE = "/OhioBrownfields/";

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  define: {
    // Build stamp shown in the footer (rendered in the viewer's time zone).
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Ohio Brownfields",
        short_name: "OH Brownfields",
        description:
          "Interactive map and directory of every EPA ACRES brownfield property in Ohio, with county summaries and site details.",
        theme_color: "#1a2a3a",
        background_color: "#1a2a3a",
        display: "standalone",
        orientation: "any",
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,json}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // CARTO basemap tiles (standard view, keyed).
            urlPattern: ({ url }: { url: URL }) => url.host.includes("basemaps.cartocdn.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "carto-tiles",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Ohio OSIP aerial tiles (vendor/basemaps); cached like the CARTO tiles so
            // the aerial works offline the same way streets do.
            urlPattern: ({ url }: { url: URL }) => url.host === "maps.ohio.gov" && url.pathname.includes("/osip_most_current_cache/"),
            handler: "CacheFirst",
            options: {
              cacheName: "osip-tiles",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Esri basemap tiles (satellite World Imagery).
            urlPattern: ({ url }: { url: URL }) => url.host.includes("server.arcgisonline.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "esri-tiles",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
