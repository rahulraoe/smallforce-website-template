# SmallForce Slidev presentation guide

Create a finished presentation for the customer's topic. Use Slidev's native
Markdown, Vue, interaction, presenter, recording, drawing, and export features.

## Required skills

- Use `.agents/skills/create-presentation/` for the SmallForce workflow,
  quality bar, theme/add-on policy, and deployment contract.
- Use `.agents/skills/slidev/` for Slidev syntax and feature details. Read only
  the references needed for the current deck.
- Do not restore OpenSlide or add another presentation framework.

## Source contract

- Author the deck in `slides.md`.
- Put reusable Vue components in `components/`.
- Put global styles in `style.css` and reusable layouts in `layouts/` only
  when they improve the deck.
- Put deck assets in `public/assets/` and reference them as `/assets/<name>`.
- Replace the starter content. Do not ship filler, duplicate layouts, generic
  instructions, theme demos, or unlicensed demo assets.
- Keep speaker notes useful and verify overflow, contrast, hierarchy,
  alignment, click order, transitions, presenter mode, and production build.

## Theme and add-on dependencies

Only the default theme is bundled. Do not ask Slidev's development prompt to
install a missing package implicitly. Follow the package workflow in the
`create-presentation` skill: inspect, pin, install, configure, and build-test.
Use built-in Slidev capabilities before adding a community add-on.

## Preserve the SmallForce adapter

Do not remove or bypass:

- `scripts/build.mjs`;
- `worker/entry.mjs`; or
- the build paths in `smallforce.json`.

`bun run build` creates Slidev's static production application under
`dist/client`, then copies the Worker that serves those assets through
`env.ASSETS`. The deployed release is immutable. Edit locally and deploy a new
release.

## Development and deployment

```sh
bun install
bun run dev
bun run build
smallforce app deploy
smallforce app status
```

Do not add vendor-specific hosting configuration or run Wrangler. SmallForce
owns the hostname, release storage, runtime, activation, access control, and
observability. Never place API keys, passwords, OAuth credentials, or other
secrets in the presentation source or browser bundle.
