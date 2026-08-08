# SmallForce application templates

Approved starting points for applications deployed to the SmallForce Celld
runtime. Each template builds the same platform artifact shape: one Worker
module plus optional immutable browser assets.

| Template | Use it for | Build output |
| --- | --- | --- |
| `astro` | Websites and full-stack web applications | Worker + assets |
| `presentations` | OpenSlide decks authored by an agent | Worker + assets |
| `worker` | APIs, webhooks, and Worker-first applications | Worker only |

Do not clone this repository manually to create an application. Let the CLI
copy only the selected template and create the backend application record:

```sh
smallforce app init --name "Acme Site" --slug acme-site --template astro
smallforce app init --name "Quarterly Review" --slug quarterly-review --template presentations
smallforce app init --name "Acme API" --slug acme-api --template worker
```

`astro` is the default for a new empty project, so `--template astro` may be
omitted. After an agent finishes the project:

```sh
cd <project-directory>
bun run build
smallforce app deploy
smallforce app status
```

Every deployed application receives `env.DB` and `env.STORAGE`. Applications
with immutable browser files also receive `env.ASSETS`; framework adapters use
that binding to serve the current release. Runtime variables and secrets are
injected as direct server-only `env.<NAME>` values.

Each template contains its own `AGENTS.md`. Agents must read that file before
editing. `smallforce.json` is owned jointly by the project and CLI: the
template supplies build paths, and the CLI fills in application identity,
deployment state, backend URL, and the final site URL.
