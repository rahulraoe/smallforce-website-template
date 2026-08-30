import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, sessionDrivers } from "astro/config";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const siteUrl = normalizeSiteUrl(
  process.env.PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    env.PUBLIC_SITE_URL ||
    env.SITE_URL,
);

export default defineConfig({
  output: "server",
  site: siteUrl || undefined,
  trailingSlash: "never",
  // Do not add a Cloudflare KV dependency. Durable application data belongs
  // in the app-scoped SmallForce DB binding.
  session: {
    driver: sessionDrivers.lruCache(),
  },
  adapter: cloudflare({
    imageService: "compile",
    // The default workerd prerenderer can silently return zero routes in the
    // agent container. Keep Worker output, but prerender public pages in Node.
    prerenderEnvironment: "node",
  }),
  integrations: [
    react(),
    ...(siteUrl
      ? [
          sitemap({
            filter: (page) => {
              const pathname = new URL(page).pathname;
              return !pathname.startsWith("/api/") && !pathname.startsWith("/og/");
            },
            namespaces: {
              image: false,
              news: false,
              video: false,
              xhtml: false,
            },
          }),
        ]
      : []),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

function normalizeSiteUrl(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}
