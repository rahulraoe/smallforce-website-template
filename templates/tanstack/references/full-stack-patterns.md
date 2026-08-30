# Full-stack application patterns

Use these patterns when a route needs server data, mutations, identity, forms,
tables, or files. Keep feature-specific code close to the route or feature that
owns it; extract shared modules only after two real consumers need them.

## Typed server functions

Validate external input and access bindings only inside the server handler:

```ts
import { env } from "cloudflare:workers"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

const listInput = z.object({
  cursor: z.string().min(1).nullable().default(null),
  limit: z.number().int().min(1).max(100).default(25),
})

export const listCustomers = createServerFn({ method: "GET" })
  .validator(listInput)
  .handler(async ({ context, data }) => {
    if (!context.user) {
      throw new Error("Authentication is required")
    }

    return env.DB.query<{ id: string; name: string; created_at: string }>(
      `SELECT id, name, created_at
       FROM customers
       WHERE (? IS NULL OR id > ?)
       ORDER BY id
       LIMIT ?`,
      [data.cursor, data.cursor, data.limit],
    )
  })
```

Do not return secrets, binding objects, raw provider responses, or unrestricted
database rows. Select and return only the fields the browser needs.

## Choose the correct server boundary

Prefer a server function when the caller is this TanStack application. Use it
for loaders, forms, queries, and mutations because it preserves typed
input/output and avoids an unnecessary HTTP call back into the same app.

Create a server route when the caller needs a real HTTP endpoint:

- third-party webhooks and OAuth callbacks;
- external API clients;
- file downloads or browser upload endpoints;
- feeds, machine-readable documents, and deliberate health endpoints.

Do not add Express, Hono, or another server. TanStack Start already routes raw
HTTP requests through `server.handlers`.

## Normal API routes

API routes use the same file router as pages. A file at
`src/routes/api/customers.ts` owns `/api/customers`:

```ts
import { env } from "cloudflare:workers"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const createCustomerInput = z.object({
  name: z.string().trim().min(1).max(120),
})

export const Route = createFileRoute("/api/customers")({
  server: {
    handlers: {
      POST: async ({ context, request }) => {
        if (!context.user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const input = createCustomerInput.safeParse(await request.json())
        if (!input.success) {
          return Response.json({ error: "Invalid request" }, { status: 400 })
        }

        const id = crypto.randomUUID()
        await env.DB.query("INSERT INTO customers (id, name) VALUES (?, ?)", [
          id,
          input.data.name,
        ])

        return Response.json({ id, name: input.data.name }, { status: 201 })
      },
    },
  },
})
```

Handlers may use `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `ANY`.
Each receives:

- `request`: the standard incoming `Request`;
- `params`: typed dynamic path parameters;
- `context`: request middleware context, including trusted SmallForce
  `context.user`;
- `pathname`: the matched pathname;
- `next`: fall through to normal page rendering when a combined route needs it.

Await `request.json()`, `request.text()`, or `request.formData()` and validate
the result before use. Return an explicit `Response`, status code, content type,
and safe body. Never return exception stacks or provider/database internals.

A route's UI `beforeLoad` guard does not protect its server handlers. Every
private API method must perform its own authentication and authorization. A
webhook should validate the provider's signature over the original request
body before parsing or acting on it.

Do not make an SSR loader call its own `/api/*` URL. If the UI and an external
client need the same operation, place the business operation in a server-only
feature module. Call that module from a server function for the UI and from the
API handler for the external HTTP contract.

## TanStack Query with route loaders

Define a reusable query option factory, then preload it through the route's
Query client. The same definition drives SSR, caching, and client refresh:

```tsx
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

const customersQuery = (limit: number) =>
  queryOptions({
    queryKey: ["customers", { limit }],
    queryFn: () => listCustomers({ data: { cursor: null, limit } }),
  })

export const Route = createFileRoute("/customers")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(customersQuery(25)),
  component: CustomersPage,
})

function CustomersPage() {
  const customers = useSuspenseQuery(customersQuery(25))
  return <CustomerTable rows={customers.data.rows} />
}
```

Use stable, serializable query keys. Invalidate the narrowest owning key after
a mutation. Do not copy Query results into a second global state store.

## Mutations and forms

Use TanStack Form for interactive form state, Zod for the shared input
contract, and a `POST` server function for the mutation. After success,
invalidate or update the matching Query cache and communicate a clear result.

Every form must include:

- a real `form` element and submit button;
- programmatically associated labels;
- field-level validation messages;
- a disabled or pending state while submitting;
- a safe server error that does not expose internals;
- a success state or navigation outcome.

Do not rely on client validation for authorization or integrity. Repeat all
trusted validation in the server function.

## Tables and long lists

Use TanStack Table when the feature needs real column definitions, sorting,
filtering, pagination, or row selection. Keep canonical sorting/filtering state
in URL search parameters when a view should be shareable or restorable.

Use server-side pagination for unbounded data. Use TanStack Virtual only when
rendering enough rows to cause a measured browser cost. An ordinary mapped
list is clearer for small result sets.

## Files

Create upload grants on the server, upload directly from the browser to the
returned bounded URL, then complete the upload on the server:

```ts
const grant = await env.STORAGE.createUpload({
  path: `customers/${customerId}/documents/${fileName}`,
  contentType,
  sizeBytes,
})
```

The server must construct and authorize the object path. Never accept an
unrestricted path from the browser. Enforce file type and size in both the UI
and the server function. Store durable application metadata in `env.DB` only
after `completeUpload` succeeds.

## Platform identity

`context.user` is trusted only when non-null. Public and shared-password
requests receive `null`; Google and SSO requests receive the immutable
SmallForce identity. This is whole-site access identity, not an automatic
application role system.

If the customer needs application roles, map `context.user.id` to an
application-owned membership row and authorize every protected server
operation from that row. Never accept a browser-supplied email or user ID as
the principal.

## Runtime configuration

Add every binding, variable, and secret as an explicit property of
`SmallForceApplicationEnv` in `src/env.d.ts`, then configure runtime values
through the SmallForce CLI. Never use `VITE_*` or `import.meta.env` for a
server secret; Vite-prefixed values are browser-visible.
