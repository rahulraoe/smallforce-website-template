# SmallForce presentation

OpenSlide workspace adapted for SmallForce deployment.

```sh
bun install
bun run dev
```

Ask the agent to create or revise a deck under `slides/`. Read `AGENTS.md` for
the source and deployment contract. When the presentation is ready:

```sh
bun run build
smallforce app deploy
```

After deployment, use `smallforce app analytics` for human and crawler traffic
and `smallforce app diagnostics` for operational requests. See `AGENTS.md` for
the complete observability commands.

The production build is immutable. Edit the source in this project and deploy
a new release rather than trying to edit the deployed site.
