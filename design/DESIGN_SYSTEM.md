# COSMOLOG — Magazine design system

The current visual identity is the magazine C and outlined masthead in `assets/brand/`. The existing online Figma v2 pages are historical references. Current portable handoff boards are in `design/magazine/`.

## Visual identity

Use the cut C at launcher scale and the full vector masthead at publication scale. Place photography with its source, date and credit. Set editorial headlines in Playfair Display and controls in Inter. Reserve glass for the floating dock and sky toolbar. Use the native feather glyph library for actions.

## Palette
| Name | Value | Role |
|---|---|---|
| Ivory | `#F8F4EA` | App canvas |
| Surface | `#FFFCF6` | Cards, buttons, reading surfaces |
| Forest Green | `#184235` | Brand, primary CTA, icons |
| Forest Dark | `#102F26` | Intro/splash dark areas |
| Terracotta | `#C1654A` | Select accents and outlined logout |
| Sage | `#A8B89A` | Brand secondary |
| Sage Light | `#E3E9DC` | Offline banner / supportive surfaces |
| Brass | `#C79B4D` | Orbital logo, limited focus accents |
| Charcoal Ink | `#2C2A27` | Main text |
| Muted | `#62645D` | Secondary text |
| Border | `#E4DBCF` | Dividers and outlines |
| White | `#FFFFFF` | High-contrast text / system icons |

Strong light mode is the default. Dark forest is limited to intentional branded hero areas. Verify actual foreground/background contrast on screen and do not rely on accent hue alone to communicate state.

## Typography
- **Playfair Display Regular** for editorial titles and brand. Italic used sparingly for a science summary/quote.
- **Inter Regular / Medium / Semi Bold** for all controls, metadata, buttons, labels and body.
- Responsive sizes: 42/48, 34/40, 29/36, 24/30, 14/21, 12/18, 12/17, 10/14.
- Always support platform font scaling. The Figma 390×844 frames are a reference, not fixed in production.
- Avoid micro-sized 10 px copy in accessible production UI; scale metadata to user font settings.

## Components
The earlier reusable components are archived on `02 — V2 / Components`:
- Brand mark (forest/ivory).
- Feather-style SVG vector icons.
- Primary CTA, outline CTA.
- Labelled text fields.
- Selected and neutral topic chips.
- Offline banner.
- Three active bottom-nav variants (Discover/Favourites/Profile).

The component library uses the `COSMOLOG V2 / Semantic` variable collection and V2 text styles. Production Feather icons must use the assignment-required `Feather` library; no Unicode pseudo-icons.

## Composition
- Reference device is 390×844, with 24 px horizontal content inset.
- Status bar stays clear. Safe-area insets and keyboard handling are dynamic in React Native.
- Cover: 1.95:1 image above a forest caption with source, date, headline and credit. All three editions share this structure.
- Compact article rows: ~70 px source thumbnail, two-line serif title, 10–12 px metadata.
- Navigation: three logical tabs, **Discover / Favourites / Profile**. The case study's separate 'Saved' tab was dropped because it duplicates Favourites and adds unnecessary navigation complexity.
- Details is a pushed stack screen without persistent tab bar; content is scrollable and attribution remains available.
- Profile stats and timestamps are visual sample values only. They must be derived from real local storage and sync metadata in production.
- The generated Figma astronomy images are **illustrative design assets**, not actual NASA photos. Production images must come from licensed/attributed science APIs, and saved images need durable local copies for offline promises.

## Responsive and accessibility
- Touch targets >=48 dp Android, >=44 pt iOS.
- Screen-reader labels for icon-only actions.
- No long content clipping; use scroll and variable-height text.
- Clear loading, empty, error and stale/offline states.
- Respect prefers-reduced-motion.
- Validate at 320, 360, 390, 430 dp widths and with large text.
- Avoid invented live data, notifications or sync-to-other-devices claims.

## Floating controls

At standard text size centre a 264-point dock with three labelled destinations. Expand within the safe area for enlarged text. Use a single regular Liquid Glass background on supported iOS devices for the tab bar and manual Sky Viewer toolbar. Use an opaque ivory surface when Reduce Transparency is enabled, on Android and on web. Use a sage selection capsule, permanent tab labels and 48-point hit areas. Keep body copy, forms, feedback and credits on opaque surfaces. Primary actions use forest, secondary actions use sage, and internal destinations use labelled rows with a Feather chevron.
