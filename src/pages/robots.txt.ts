import type { APIRoute } from "astro";
import { site } from "@/lib/site";

export const prerender = true;

export const GET: APIRoute = () => {
  if (!site.url) {
    return textResponse(["User-agent: *", "Disallow: /", ""].join("\n"));
  }

  const sitemapUrl = new URL("/sitemap.xml", site.url).toString();

  return textResponse(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${sitemapUrl}`,
      "",
    ].join("\n"),
  );
};

function textResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
