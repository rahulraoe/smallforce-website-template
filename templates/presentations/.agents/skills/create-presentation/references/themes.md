# Theme selection

Slidev uses one theme per project. Themes may provide layouts, components,
styles, and configuration. Only `@slidev/theme-default` is installed in the
SmallForce template; every other theme is an exact, project-owned dependency.

## Selection workflow

1. Translate the brief into visual attributes such as restrained, editorial,
   energetic, technical, scholarly, playful, tactile, or image-led.
2. If the user has not named a theme and the choice is material, present two or
   three visual directions in audience language rather than a long list of npm
   package names.
3. Inspect previews, README, layouts, components, license, bundled assets,
   maintenance, peer dependencies, and current Slidev compatibility.
4. Pin and install only the selected theme, then build the complete deck.

Use `default` plus local CSS for a unique customer brand or when a packaged
theme adds little value. A theme is a capability choice, not a substitute for
designing the deck.

## First-party discovery set

| Package | Direction | Notes |
| --- | --- | --- |
| `@slidev/theme-default` | Neutral and adaptable | Bundled baseline; strong base for local design |
| `@slidev/theme-seriph` | Editorial and formal | Serif-led, suitable for essays and talks |
| `@slidev/theme-apple-basic` | Minimal product keynote | Use only when the brief calls for it |
| `@slidev/theme-bricks` | Graphic and playful | Branded illustration assets require review |
| `@slidev/theme-shibainu` | Character-led and playful | Specialized; review bundled assets |

The first-party theme repository licenses code under MIT but separately marks
images and assets as CC BY-NC-SA 4.0. Inspect what the selected package ships
and do not copy demo media into a commercial customer deck.

## Community discovery map

These are starting points, not an allowlist:

- **Business and product:** Geist, Light Icons, Eloc, Neversink, Tahta.
- **Formal and editorial:** Seriph, Frankfurt, Mint.
- **Academic and scientific:** Academic, Scholarly, HEP, Touying.
- **Developer and dark:** Nord, Dracula, The Unnamed, Vuetiful, Mokkapps.
- **Workshop and illustrative:** Excali-slide, Field Manual, Takahashi.
- **Expressive and playful:** Purplin, Unicorn, Penguin, Zhozhoba, KTYM4A.

Read [gallery-snapshot.md](gallery-snapshot.md) for exact package identifiers
from the checked-in Slidev registry. Run `bun run refresh:catalog` before a
current ecosystem recommendation.

Gallery inclusion does not guarantee maintenance, compatibility, accessibility,
or commercial-use licensing. Missing or ambiguous license metadata requires
manual repository review before installation.
