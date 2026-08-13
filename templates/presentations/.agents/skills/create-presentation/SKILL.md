---
name: create-presentation
description: Create, revise, theme, extend, and verify polished Slidev presentations in the SmallForce presentation template. Use for any customer slide deck, web presentation, talk, pitch, lesson, report, interactive presentation, presenter-notes task, or Slidev theme/add-on request in this project.
---

# Create a Slidev presentation

Produce a finished audience-specific story, not a decorated document. Preserve
the SmallForce build and deployment adapter while using Slidev's native
capabilities intentionally.

## Start with the real brief

1. Inspect `AGENTS.md`, `slides.md`, `package.json`, and the available assets.
2. Identify the audience, setting, desired decision, source material, brand
   constraints, duration, and requested deliverables. Make reasonable content
   assumptions when they do not change the customer's intent.
3. Draft the narrative arc before styling individual slides. Give each slide
   one job and vary its composition with the story.
4. Read [quality.md](references/quality.md) before authoring or revising the
   deck.

## Use Slidev completely

Read `.agents/skills/slidev/SKILL.md`, then open only the official reference
files relevant to the requested features. That vendored upstream skill covers
syntax, frontmatter, layouts, components, clicks, motion, Magic Move, code,
Monaco, diagrams, math, drawing, presenter mode, recording, export, and MCP.

Do not simulate a built-in Slidev feature with a custom dependency. Prefer:

- `v-click`, `v-after`, `v-clicks`, `v-motion`, slide transitions, and Shiki
  Magic Move for progressive storytelling;
- built-in layouts, Vue components, Mermaid, PlantUML, KaTeX, Monaco, drawing,
  video, icons, and draggable elements when appropriate;
- normal Markdown and accessible HTML when interaction adds no value.

Keep the production feature contract in
[deployment.md](references/deployment.md). Do not expose secrets or rely on a
development-only editor in a deployed presentation.

## Select a theme intentionally

Read [themes.md](references/themes.md) when selecting, changing, or discussing
a theme. Read [gallery-snapshot.md](references/gallery-snapshot.md) only when a
broader gallery search is useful.

- Use the customer's named theme when compatible and legally usable.
- Otherwise choose a visual direction from the audience, subject, brand, and
  tone. Do not impose an Apple-like, corporate, dark, or developer aesthetic.
- Use `default` plus deck-owned CSS when a distinctive local design is more
  appropriate than a community theme.
- Use exactly one theme. Do not preinstall speculative themes.

For every theme other than the bundled default:

1. Run `bun run inspect:package -- <package>`.
2. Inspect the package README, repository license, assets, supported layouts,
   peer dependencies, and current Slidev compatibility. Registry metadata
   alone is not a license audit.
3. Install an exact version with `bun add -D <package>@<version>`.
4. Use the full package name in headmatter when it is scoped or ambiguous.
5. Build the complete deck. Remove the package if it is rejected or unused.

## Add capabilities conservatively

Read [addons.md](references/addons.md) before adding any add-on. Slidev gallery
entries are discoverability, not SmallForce approval.

- Use built-ins first.
- Install only an add-on that serves a concrete customer requirement.
- Inspect and pin it with the same package workflow as a theme.
- Treat code runners, external services, server-backed sync, remote control,
  React bridges, and embedded IDEs as higher risk. Use them only when the
  request implies that capability and verify their production behavior.
- Put each selected package under `addons:` in headmatter and test the actual
  feature, not merely dependency installation.

Run `bun run refresh:catalog` when the user asks for current ecosystem choices
or when the checked-in gallery snapshot is stale. Review the resulting diff;
new gallery entries are not automatically trusted.

## Author and verify

1. Replace the starter deck in `slides.md`; do not append customer work to it.
2. Put reusable Vue components in `components/`, global styling in `style.css`,
   and local assets in `public/assets/`.
3. Write useful speaker notes. Record factual and media sources in notes or a
   dedicated references slide when attribution matters.
4. Check every click state, transition, interactive component, overflow,
   contrast, alignment, image crop, and continuity in the rendered deck.
5. Run `bun run build` and `bun test`.
6. Verify the production build at `/`, presenter mode at `/presenter`, notes,
   recording/drawing controls when used, and browser export when requested.
7. Export PDF or PPTX only when requested. Explain that Slidev's PPTX export
   does not make arbitrary HTML/Vue slides natively editable PowerPoint
   objects.

Do not call the work complete because Markdown compiles. The presentation must
communicate clearly and work in the built SmallForce application.
