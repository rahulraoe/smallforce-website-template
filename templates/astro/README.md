# SmallForce Astro application

Full-stack Astro starter for websites, portals, forms, dashboards, and other
applications that benefit from Astro pages and API routes.

```sh
bun install
bun run dev
```

Read `AGENTS.md` before changing the project. When the application is ready:

```sh
bun run build
smallforce app deploy
```

After deployment, use `smallforce app logs`, `smallforce app analytics`, and
`smallforce app diagnostics` to inspect the owned application without adding
public debugging routes. See `AGENTS.md` for the exact commands and security
boundary.

Server-side pages and API routes access the application bindings with
`import { env } from "cloudflare:workers"`. Keep `.astro` files native-first,
using native HTML with `class` and `for`. Compose supplied React shadcn/ui
components in `.tsx` files, where JSX uses `className` and `htmlFor`, and then
import those components into the Astro page. Add `client:*` only when the
React component needs browser-side interactivity.

The normal build checks this boundary and rejects direct `components/ui`
imports from `.astro` files.

The build emits `dist/worker/entry.mjs` and `dist/client/`. Do not deploy those
folders directly; the SmallForce CLI packages and activates them as one
immutable application release.

Public pages include canonical metadata, Open Graph and Twitter cards, JSON-LD
support, `robots.txt`, and an automatically generated sitemap. The versioned
SmallForce marketing card at `public/og/smallforce-default-v2.jpg` is the safe
fallback. Replace it with a versioned, customer-specific card before shipping
a finished public website.

`bun run og:render` reproduces the fallback using the editable source in
`scripts/render-og.mjs` and `scripts/og-assets/`. Adapt those inputs for the
customer rather than layering text over arbitrary gradients. Always change the
output filename when the artwork changes because social networks cache shared
images independently of a website deployment.

After building a public site, validate its generated SEO artifacts:

```sh
bun run build
bun run check:seo
```
