// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";

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
    defaultStrategy: "tap",
  },
  cache: {
    provider: cacheCloudflare(),
  },
});
