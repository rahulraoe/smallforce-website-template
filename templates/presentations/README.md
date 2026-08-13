# SmallForce presentation

Slidev workspace adapted for SmallForce deployment.

```sh
bun install
bun run dev
```

Ask the agent to create or revise `slides.md`. `AGENTS.md` defines the source,
theme/add-on, and deployment contract. When the presentation is ready:

```sh
bun run build
smallforce app deploy
```

The production presentation retains Slidev's presenter, notes, recording,
drawing, and browser export surfaces configured in `slides.md`. The deployed
release is immutable; edit this project and deploy a new release.
