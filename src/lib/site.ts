import { getSmallForceConfig } from "@/lib/smallforce";

const config = getSmallForceConfig();

export const site = {
  name: config.name || "SmallForce App",
  description:
    "A generated Astro app template for SEO websites, content hubs, dashboards, and simple fullstack workflows.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/api/health", label: "Health" },
  ],
};
