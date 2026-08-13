# SmallForce Slidev production contract

## Required headmatter baseline

Preserve these settings unless a customer requirement clearly conflicts:

```yaml
presenter: build
record: build
browserExporter: build
contextMenu: build
editor: false
mcp: true
routerMode: hash
selectable: true
aspectRatio: 16/9
canvasWidth: 1920
drawings:
  enabled: build
  persist: false
  syncAll: true
```

`presenter`, `record`, `browserExporter`, `contextMenu`, and drawings set to
`build` retain those surfaces in the static production application. Keep the
side editor disabled in production. MCP is for agent-assisted development; it
does not replace the source-controlled authoring workflow.

Hash routing avoids path collisions in a static deployment. The SmallForce
Worker still falls back to `index.html` for Slidev application routes such as
`/presenter`.

## Build and deploy

```sh
bun install
bun run build
bun test
smallforce app deploy
smallforce app status
```

The build script must continue to:

1. remove the previous `dist/` output;
2. build Slidev into `dist/client`;
3. copy `worker/entry.mjs` into `dist/worker/entry.mjs`.

Do not add Netlify, Vercel, GitHub Pages, Zephyr, or Wrangler configuration.
SmallForce owns deployment and routing through `smallforce.json`.

## Operational boundaries

- A deployed deck is immutable. Revise the source and deploy a new release.
- Speaker notes are included when presenter mode is built. Use
  `--without-notes` only when the customer explicitly wants a public build
  without them.
- Remote assets and external embeds create runtime dependencies. Prefer local
  files; disclose intentional external services.
- Remote control or sync add-ons that require SSE, WebSockets, or a server do
  not become operational merely because the static build succeeds.
- Never place credentials, private source material, or confidential notes in a
  public/browser bundle.
