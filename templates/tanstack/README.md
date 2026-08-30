# SmallForce TanStack application

The default full-stack application starter for dashboards, portals, internal
tools, customer-facing products, and operational software.

It includes TanStack Start, Router, Query, Form, Table, and Virtual; React 19;
Tailwind CSS 4; every current shadcn/ui component; Zod; dark mode; and the
SmallForce Worker entry needed for HTTP, Workflows, Queues, and Cron Triggers.

```sh
bun install
bun run dev
```

Read `AGENTS.md` before changing the project. It contains the platform
contracts and safe implementation patterns agents must preserve.

When the application is ready:

```sh
bun run check
smallforce app deploy
```

The build emits `dist/server/index.js` and `dist/client/`. Do not deploy
these folders with Wrangler. The SmallForce CLI packages them into one
immutable release and activates it in Preview.

