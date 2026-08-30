import manifest from "../../smallforce.json";

const configuredSiteUrl =
  import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || "";

const siteName = manifest.name || "SmallForce App";

// Replace these defaults with the customer's real public identity while
// building the site. Keep deployment state and business content separate:
// smallforce.json remains the CLI-owned project manifest.
export const site = {
  name: siteName,
  description:
    "A generated Astro app template for SEO websites, content hubs, dashboards, and simple fullstack workflows.",
  url: normalizeSiteUrl(configuredSiteUrl),
  language: "en",
  locale: "en_US",
  socialImage: "/og/smallforce-default-v2.jpg",
  socialImageAlt: "SmallForce — Your business, run by AI employees.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
  ],
};

export function absoluteSiteUrl(pathname = "/"): string | null {
  try {
    return new URL(pathname).toString();
  } catch {
    // Relative paths are resolved against the configured canonical origin.
  }

  if (!site.url) return null;

  return new URL(pathname, site.url).toString();
}

function normalizeSiteUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}
