import { getSmallForceConfig } from "@/lib/smallforce";

const config = getSmallForceConfig();
const configuredSiteUrl =
  import.meta.env.PUBLIC_SITE_URL ||
  import.meta.env.SITE_URL ||
  config.deploymentUrl ||
  defaultSmallForceSiteUrl(config.slug);

export const site = {
  name: config.name || "SmallForce App",
  description:
    "A generated Astro app template for SEO websites, content hubs, dashboards, and simple fullstack workflows.",
  url: normalizeSiteUrl(configuredSiteUrl),
  nav: [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
  ],
};

export function absoluteSiteUrl(pathname = "/"): string | null {
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

function defaultSmallForceSiteUrl(slug: string): string | null {
  const trimmedSlug = slug?.trim();
  if (!trimmedSlug) return null;

  const suffix =
    import.meta.env.PUBLIC_SMALLFORCE_APPS_HOST_SUFFIX ||
    import.meta.env.SMALLFORCE_APPS_HOST_SUFFIX ||
    ".swwitchcrm.com";
  const normalizedSuffix = suffix.startsWith(".") ? suffix : `.${suffix}`;

  return `https://${trimmedSlug}${normalizedSuffix}`;
}
