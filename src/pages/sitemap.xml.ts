import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { site } from "@/lib/site";

export const prerender = true;

type SitemapEntry = {
  path: string;
  lastmod?: Date;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

export const GET: APIRoute = async () => {
  if (!site.url) {
    return xmlResponse(renderSitemap("https://example.com", []));
  }

  const posts = (await getCollection("blog")).filter((post) => !post.data.draft);
  const now = new Date();
  const entries: SitemapEntry[] = [
    {
      path: "/",
      lastmod: now,
      changefreq: "weekly",
      priority: 1,
    },
    {
      path: "/blog",
      lastmod: latestDate(posts.map((post) => post.data.updatedDate || post.data.pubDate)) || now,
      changefreq: "weekly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      path: `/blog/${post.id}`,
      lastmod: post.data.updatedDate || post.data.pubDate,
      changefreq: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return xmlResponse(renderSitemap(site.url, entries));
};

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

function renderSitemap(origin: string, entries: SitemapEntry[]): string {
  const body = entries.map((entry) => renderUrl(origin, entry)).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");
}

function renderUrl(origin: string, entry: SitemapEntry): string {
  const url = new URL(entry.path, origin).toString();
  const lastmod = entry.lastmod ? entry.lastmod.toISOString().slice(0, 10) : null;

  return [
    "  <url>",
    `    <loc>${escapeXml(url)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
    entry.priority ? `    <priority>${entry.priority.toFixed(1)}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

function latestDate(values: Date[]): Date | null {
  const timestamps = values.map((value) => value.valueOf()).filter(Number.isFinite);
  if (timestamps.length === 0) return null;

  return new Date(Math.max(...timestamps));
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
