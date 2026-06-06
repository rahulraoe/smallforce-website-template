# SmallForce App Template Instructions

This project is the starting point for generated SmallForce apps. Edit it freely for the customer request, but keep the SmallForce control-plane rules below intact.

## App Shape

Use one Astro template for all generated apps.

- SEO/content site: create the app as `static`, use Astro pages and content collections, and do not enable DB.
- Dashboard, CRM, forms with persistence, or API routes: create the app as `fullstack`, then enable DB only when persistence is required.

Content-heavy sites are still `static` apps in the SmallForce backend. Use `src/content/blog` and `src/content.config.ts` for blogs, guides, locations, FAQs, and case studies.

## Local Development

```bash
bun install
bun run dev
bun run build
```

The template uses Astro, Tailwind CSS, shadcn/ui React components, Astro content collections, and the Astro Cloudflare adapter.

Astro sessions are configured with an in-memory driver so the Cloudflare adapter does not add a customer-visible KV binding. Use SmallForce DB for persistent data.

## Agent Flow

Use the SmallForce CLI outside the deployed app runtime. Never commit or embed a SmallForce API key in this project.

Create a new project and backend app record:

```bash
smallforce app init --name "Customer Site" --slug customer-site --type static
```

Create a fullstack app with DB from the start:

```bash
smallforce app init --name "Customer CRM" --slug customer-crm --type fullstack --db
```

If the current project already exists and only needs DB later:

```bash
smallforce app db enable
```

Deploy the current project:

```bash
smallforce app deploy
```

Poll the latest app/deployment state:

```bash
smallforce app status
```

The CLI reads and writes `smallforce.json`. Agents should use that file as local memory for `appId`, latest `deploymentId`, slug, capabilities, and deployment URL. The backend does not trust values from the uploaded artifact.

If the backend returns `APP_SLUG_TAKEN`, choose another slug and retry. Slugs are globally unique across SmallForce app subdomains.

## Deployment

The simplified deploy command handles the build and artifact upload:

```bash
smallforce app deploy
```

By default it runs `bun run build`, zips `dist`, uploads the zip to the SmallForce backend, and writes the returned deployment id to `smallforce.json`.

The backend stages the artifact privately, creates a new deployment row for each deploy attempt, queues Cloudflare publishing, and owns all deployment status changes.

For Astro on Cloudflare, the build output is:

```text
dist/
  client/   # prerendered pages and static assets
  server/   # Cloudflare Worker server bundle and API routes
```

## Runtime DB Access

Only use this for apps where `smallforce app db enable` has been run.

Use `src/lib/smallforce` from server routes only:

```ts
import { sfDb } from "@/lib/smallforce";

const result = await sfDb.query("SELECT * FROM customers WHERE id = ?", [
  "customer_123",
]);
```

Do not add D1/R2/KV bindings to this app. Generated app code must access persistent data through the SmallForce backend runtime.

## Control-Plane Rules
