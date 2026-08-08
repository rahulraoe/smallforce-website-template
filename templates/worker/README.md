# SmallForce API Worker

Framework-free TypeScript Worker for APIs, webhooks, and server-only
applications.

```sh
bun install
bun run check
bun test
bun run build
smallforce app deploy
```

Read `AGENTS.md` before editing. The build emits one Worker module at
`dist/worker/entry.mjs`; there is no browser asset directory.
