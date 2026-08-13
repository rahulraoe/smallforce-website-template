# Add-on selection

Add-ons may provide layouts, components, styles, and configuration. The Slidev
gallery currently lists community packages; gallery inclusion is not a
security, compatibility, maintenance, or licensing approval. SmallForce
preinstalls no community add-ons.

## Use built-ins first

Do not add a package for capabilities Slidev already provides, including click
reveals, motion, slide transitions, Shiki Magic Move, arrows and draggable
arrows, drawing, rough markers, Mermaid, PlantUML, KaTeX, Monaco, code runners
supported by Slidev, video, YouTube, iframes, icons, presenter notes, recording,
timer, overview, and browser export.

## Frequent candidates

Inspect and build-test every candidate:

| Package | Use when | Important review |
| --- | --- | --- |
| `slidev-addon-tldraw` | The audience needs an editable whiteboard or freeform diagram | Large React/Vue surface; editing and persistence behavior |
| `slidev-addon-fancy-arrow` | Hand-drawn connectors materially improve an explanation | Prefer built-in arrows for ordinary diagrams |
| `slidev-addon-window-mockup` | A product or browser frame clarifies a demo | Ensure it adds more than simple local CSS |
| `slidev-component-spotlight` | A live presenter needs to focus a region | Keyboard behavior and production support |
| `slidev-component-zoom` | Fine detail must be inspected during delivery | Accessibility and input behavior |
| `slidev-component-poll` | The talk explicitly includes audience participation | Data flow, connectivity, and privacy |

## Domain-specific candidates

- **Scientific and mathematical:** `slidev-addon-typst`,
  `slidev-addon-tikzjax`, `slidev-addon-stem`.
- **Code execution and creative coding:** `slidev-addon-python-runner`,
  `slidev-addon-p5`, `slidev-addon-sandpack`.
- **Business modeling:** `slidev-addon-bpmn`, `slidev-addon-dmn`.
- **Media:** `slidev-addon-hls-player`, `slidev-addon-animated-text`.
- **Navigation and delivery:** `slidev-component-pager`,
  `slidev-component-progress`, `slidev-component-scroll`,
  `slidev-addon-rabbit`, `slidev-pane`.
- **Component systems:** `slidev-addon-naive`.

Install these only when the requested content needs them. Verify any runtime,
browser, network, data, or licensing assumptions.

## Higher-risk or overlapping candidates

- `slidev-addon-sync` requires an SSE or WebSocket server; the SmallForce
  presentation deployment is otherwise a static SPA.
- `slidev-addon-second-screen` changes presenter behavior and must be tested in
  the actual production browser environment.
- `slidev-addon-livecode`, Python Runner, p5, and Sandpack execute or embed code
  and may depend on external services.
- `slidev-addon-react` adds a React bridge to Vue-based Slidev. Use only for a
  concrete existing React component requirement.
- `slidev-agent` overlaps with the SmallForce agent and official Slidev MCP
  workflow; do not add it by default.

## Installation workflow

```sh
bun run inspect:package -- <package>
bun add -D <package>@<exact-version>
```

Then add the full package identifier to headmatter:

```yaml
addons:
  - slidev-addon-fancy-arrow
```

Test the component or behavior in development and in `bun run build`. Remove
unused or rejected packages and their headmatter entries.
