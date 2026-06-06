import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, sessionDrivers } from "astro/config";

export default defineConfig({
  output: "static",
  // Avoid Astro's default Cloudflare KV session binding. Persistent data must go through SmallForce DB.
  session: {
    driver: sessionDrivers.lruCache(),
  },
  adapter: cloudflare({
    imageService: "passthrough",
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
