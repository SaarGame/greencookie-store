// @ts-check
import { defineConfig, memoryCache } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Reverse tunnel for mobile access to localhost
      allowedHosts: ["bull-upward-mostly.ngrok-free.app"],
    },
  },
  output: "server",
  adapter: cloudflare(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  cache: {
    provider: memoryCache({
      max: 1000 // max 1000 pages cached
    }),
  },

});