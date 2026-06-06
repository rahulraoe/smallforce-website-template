# SmallForce App Template Instructions

This repository is the starting point for generated SmallForce apps. Build the real app requested by the customer; do not leave placeholder smoke-test UI in the final result.

## App Shape

Use this Astro template for all generated apps.

- Use `static` for SEO/content sites, landing pages, docs, guides, and other pages that do not need API routes or persistence.
- Use `fullstack` for dashboards, CRMs, forms, customer portals, upload flows, API routes, and any app that needs server-side work.
- Enable DB only when the app needs persistent records. Storage is available through the runtime storage helper and does not need a separate app capability flag.

Content-heavy sites are still `static` apps in the SmallForce backend. Use `src/content/blog` and `src/content.config.ts` for blogs, guides, locations, FAQs, and case studies.

## Local Development

```bash
bun install
bun run dev
bun run build
```

The template uses Astro, Tailwind CSS, shadcn/ui React components, Astro content collections, and the Astro Cloudflare adapter.

Astro sessions use an in-memory driver so the Cloudflare adapter does not add a customer-visible KV binding. Use SmallForce DB for persistent data.

## Agent Flow

Use the SmallForce CLI outside the deployed app runtime. Never commit or embed a SmallForce API key in this project.

Create a static app:

```bash
smallforce app init --name "Customer Site" --slug customer-site --type static
```

Create a fullstack app with DB from the start:

```bash
smallforce app init --name "Customer CRM" --slug customer-crm --type fullstack --db
```

Enable DB later for an existing app:

```bash
smallforce app db enable
```

Deploy:

```bash
smallforce app deploy
```

Poll app/deployment state:

```bash
smallforce app status
```

The CLI reads and writes `smallforce.json`. Treat that file as local app state for `appId`, latest `deploymentId`, slug, capabilities, runtime paths, and deployment URL. The backend does not trust values from the uploaded artifact.

If the backend returns `APP_SLUG_TAKEN`, choose another slug and retry. Slugs are globally unique across SmallForce app subdomains.

## Deployment

`smallforce app deploy` runs the build, zips the configured output directory, uploads the artifact to the SmallForce backend, and writes the returned deployment state to `smallforce.json`.

For Astro on Cloudflare, the build output is:

```text
dist/
  client/   # prerendered pages and static assets
  server/   # Cloudflare Worker server bundle and API routes
```

The backend stages the artifact privately, creates a new deployment row for each deploy attempt, queues Cloudflare publishing, and owns all deployment status changes.

## SEO Defaults

Generated public websites should be SEO-ready by default. Keep `robots.txt`, `sitemap.xml`, page titles, descriptions, canonical URLs, and crawlable content working unless the customer explicitly wants a private app.

The template generates these files during `bun run build`:

- `/robots.txt`
- `/sitemap.xml`

The canonical site URL is resolved in this order:

1. `PUBLIC_SITE_URL`
2. `SITE_URL`
3. `smallforce.json.deploymentUrl`
4. `https://{smallforce.json.slug}.swwitchcrm.com`

For custom domains, set `PUBLIC_SITE_URL` or `SITE_URL` to the final customer domain before building. If no site URL or slug is known, the template emits a safe `Disallow: /` robots file and an empty sitemap rather than publishing incorrect URLs.

When adding pages or content collections, make sure they are included in the sitemap. The default sitemap includes `/`, `/blog`, and non-draft blog posts.

## Runtime Helpers

Use `src/lib/smallforce` from server routes only. Do not call these helpers from browser React components.

Browser code should call your app's API routes. Your API routes should call `sfDb` and `sfStorage`.

Do not add D1, R2, KV, or S3 credentials/bindings to generated apps. Persistent data and file storage must go through the SmallForce backend runtime.

## Production API Access Control

Every deployed app API route is public unless the app checks its own user auth. SmallForce runtime signing protects the app-to-backend call, but it does not protect browser-to-app routes like `/api/customers`, `/api/files/list`, or `/api/files/download`.

Do not expose raw or broad runtime access:

- Do not create public generic SQL routes such as `/api/db/query`.
- Do not return D1 rows from public read/list endpoints unless the data is intentionally public.
- Do not expose `sfStorage.list`, `sfStorage.get`, or `sfStorage.delete` through public routes without checking authorization first.
- Do not accept arbitrary storage `path` values from the browser and turn them into download URLs without verifying ownership/permission in D1.

Public routes should be narrow and usually write-only. For example, an HVAC website can expose `POST /api/contact` to create a lead, but `GET /api/leads` must require admin auth.

For apps with private data or admin dashboards, use the built-in D1-backed auth helpers before adding private read/list/download/delete routes. The helpers create this schema automatically:

```ts
await sfDb.query(`
  CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    password_hash TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

await sfDb.query(`
  CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )
`);

await sfDb.query(`
  CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash
    ON auth_sessions (session_token_hash)
`);

await sfDb.query(`
  CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
    ON auth_sessions (user_id)
`);
```

Store only a hash of the session token in D1. Put the raw session token only in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Private API routes should load the session, join to `auth_users`, verify `expires_at`, check the required role/ownership, and only then call `sfDb` or `sfStorage`.

Prefer business IDs over raw storage paths in browser requests. For example, accept `{ "fileId": "..." }`, load the file row from D1, check the user can access that row, then call `sfStorage.get({ path: row.storage_path })`.

## Built-In Auth Helpers

Use these helpers from Astro API routes when the app needs private data, admin dashboards, customer portals, protected file downloads, or protected record lists.

```ts
import {
  authErrorResponse,
  createAuthUser,
  createSession,
  destroyCurrentSession,
  findAuthUserByEmail,
  requireAdmin,
  requireUser,
  verifyPassword,
} from "@/lib/smallforce";
```

Protect an admin route:

```ts
import type { APIRoute } from "astro";
import { authErrorResponse, requireAdmin, sfDb } from "@/lib/smallforce";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);

    const leads = await sfDb.query("SELECT * FROM leads ORDER BY created_at DESC LIMIT 100");
    return Response.json({ ok: true, leads });
  } catch (error) {
    return authErrorResponse(error) ?? Response.json(
      { ok: false, message: "Unable to load leads." },
      { status: 500 },
    );
  }
};
```

Protect a customer/user route:

```ts
import type { APIRoute } from "astro";
import { authErrorResponse, requireUser } from "@/lib/smallforce";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const { user } = await requireUser(request);
    return Response.json({ ok: true, user });
  } catch (error) {
    return authErrorResponse(error) ?? Response.json(
      { ok: false, message: "Unable to load account." },
      { status: 500 },
    );
  }
};
```

Create a login route with password verification and an `HttpOnly` session cookie:

```ts
import type { APIRoute } from "astro";
import { createSession, findAuthUserByEmail, verifyPassword } from "@/lib/smallforce";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { email, password } = await request.json();
  const user = typeof email === "string" ? await findAuthUserByEmail(email) : null;

  if (!user || !(await verifyPassword(String(password || ""), user.passwordHash))) {
    return Response.json(
      { ok: false, message: "Invalid email or password." },
      { status: 401 },
    );
  }

  const session = await createSession(user.id);

  return Response.json(
    { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    { headers: { "set-cookie": session.cookie } },
  );
};
```

Create an admin user only from a protected seed/admin setup path, never from an open public signup route:

```ts
const existing = await findAuthUserByEmail("owner@example.com");

if (!existing) {
  await createAuthUser({
    email: "owner@example.com",
    password: "replace-with-a-real-password",
    name: "Owner",
    role: "admin",
  });
}
```

Logout by deleting the current session and clearing the cookie:

```ts
import type { APIRoute } from "astro";
import { destroyCurrentSession } from "@/lib/smallforce";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const clearCookie = await destroyCurrentSession(request);

  return Response.json(
    { ok: true },
    { headers: { "set-cookie": clearCookie } },
  );
};
```

`createAuthUser` defaults to `role: "user"`. Pass `role: "admin"` explicitly only when creating trusted admin accounts.

## Runtime DB Access

Only use DB when `smallforce app db enable` has been run or the app was initialized with `--db`.

```ts
import { sfDb } from "@/lib/smallforce";

const result = await sfDb.query("SELECT * FROM customers WHERE id = ?", [
  "customer_123",
]);
```

Create tables in server routes when the app first needs them:

```ts
await sfDb.query(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    attachment_path TEXT,
    created_at TEXT NOT NULL
  )
`);
```

## Runtime Storage Access

Use `sfStorage` from `src/lib/smallforce` inside Astro API routes.

Storage is app-scoped. Save only the object `path` and metadata in D1. Do not save presigned URLs in D1 because they expire.

Available helpers:

```ts
import { sfStorage } from "@/lib/smallforce";

await sfStorage.upload(file, { path: "customers/customer_123/brief.pdf" });
await sfStorage.get({ path: "customers/customer_123/brief.pdf" });
await sfStorage.list({ prefix: "customers/customer_123/", limit: 50 });
await sfStorage.delete({ path: "customers/customer_123/brief.pdf" });
```

### Upload a File

Use a server route as the upload boundary. The browser posts `FormData` to your app; the route uploads to SmallForce storage and returns/stores the object metadata.

Public uploads are acceptable only for constrained create-only flows such as contact forms, support requests, lead intake, or job applications. Upload, list, download, and delete routes for existing private records must require auth and verify ownership/role before touching storage.

## Recommended Storage + D1 Pattern

For real apps, combine D1 and storage like this:

1. Browser submits a form to your app API route.
2. The API route validates fields and file.
3. The API route uploads the file with `sfStorage.upload`.
4. The API route inserts or updates the D1 row with the stable storage `path`, original filename, content type, file size, and created timestamp.
5. Private UI routes require D1-backed auth before loading records from D1 or listing files with `sfStorage.list`.
6. The UI requests a temporary download URL through your own API route, which checks auth/ownership and then calls `sfStorage.get`.
7. Deletes go through your API route, which checks auth/ownership, calls `sfStorage.delete`, and then updates D1 metadata.

This keeps the browser away from runtime secrets and keeps D1 as the source of truth for user-facing records.
