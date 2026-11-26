# COSMOLOG — Canonical Project Context

## Identity
- Name: COSMOLOG
- Tagline: A pocket archive of the universe.
- Brand promise: Discover with curiosity. Keep what matters.
- Student index: 234202J
- Course: IN3210 Mobile Applications Development
- Assignment: Assignment 2 — Build Your Own Discovery App
- Deadline: 2026-12-13 23:59 local course time.

## Assignment mapping
The numeric portion of 234202J is 234202:
- Last digit `2` => Space & Science.
- Second-last digit `0` => Offline-first.
The suffix `J` is not part of the two numeric digit calculation.

## Product concept
COSMOLOG is an editorial science discovery journal. It has three content experiences:
1. **The Daily Plate** — one astronomy image with its explanation, date and source credit.
2. **Space Dispatches** — spaceflight and mission articles from a public API.
3. **The Field Shelf** — the user's locally persistent saved discoveries.

Differentiation is in editorial curation, source-aware reading, and dependable offline preservation. Do not claim that no similar product exists.

## Product principles
1. Editorial, not theatrical: warm ivory, forest green, terracotta, brass and sage; no generic black/neon-blue/purple AI aesthetic.
2. Science with provenance: source, author/credit, publication date and original link must remain visible.
3. Offline as a first-class state: cached content is useful and clearly labelled as potentially stale.
4. No false freshness: show last successful synchronization, never device time as a substitute.
5. Save means preserve: favourited records and required image files survive app restarts and network loss.
6. Keep scope honest: no custom backend unless a real requirement appears.
7. Accessibility and reduced motion are product requirements, not polish-only tasks.

## Brand — magazine edition (current)
- Original visual references: `design/references/reference-brand-system.png` and `reference-mobile-case-study.png`.
- Magazine handoff: `design/magazine/`. The existing Figma file preserves the v2 reference pages.
- Mark: a typographic C with diagonally cut terminals.
- Wordmark: outlined COSMOLOG masthead in Playfair Display Bold; tagline in Playfair Display Italic.
- Interface type: Inter.
- Palette: Ivory #F8F4EA, Forest #184235, Terracotta #C1654A, Sage #A8B89A, Brass #C79B4D, Ink #2C2A27.
- Production app uses real attributed remote astronomy photos; Figma mockup's generated editorial imagery is illustrative only.
- Main navigation: Discover / Favourites / Profile (no redundant separate Saved tab).
- Launcher icon is a static platform asset. Animate the in-app reveal after native splash; respect reduced motion.
- Do not implement archived v1 screens or old tokens.

## Core audience and PACT
- People: university students, curious learners and astronomy enthusiasts.
- Activities: browse, read, understand, save and revisit discoveries.
- Contexts: campus, home, commuting, variable network access, low bandwidth and offline use.
- Technologies: Android/iOS phone, touch UI, network APIs, local SQLite, secure credential storage; optional magnetometer only if justified.

## Core user journey
Launch → read secure session → auth gate → Login/Register → Discover → Details (route receives ID/source only) → Save → Favourites / Field Shelf → app restart → reopen saved content offline.

## Navigation
- Separate auth route group.
- Main bottom tabs: Discover, Favourites, Profile.
- Details route is pushed from Discover and Favourites.
- Typed route parameters: `source` and `itemId`; never pass a whole API object as navigation params.
- Registration is simulated through DummyJSON; explain this honestly in UI/docs.

## Offline-first invariants
- SQLite is the durable source for previously loaded feed data and favourites.
- On startup, read local data first and render it without waiting for network.
- If online, refresh remote feeds and upsert validated/normalized records transactionally.
- If offline, keep the last loaded list and all favourites usable.
- Display an offline indicator when offline and a truthful `lastSyncedAt` timestamp.
- On reconnection, refresh without duplicate rows or overwriting a user's favourite state.
- Saved images must be copied into persistent app storage when favourited if the product promises guaranteed offline image access. Expo Image's cache alone is not a durable guarantee.
- First-run offline state must explain that no content has been downloaded yet; do not fabricate placeholder articles.
- Distinguish network failure from an empty successful response.

## API boundaries
- `DummyJsonAuthService`: login and simulated registration only.
- `NasaApodService`: isolates NASA response mapping and media handling.
- `SpaceflightNewsService`: isolates article API mapping.
- Normalize both content sources into a discriminated local `DiscoveryItem` model.
- Store external source ID and source type. Use a composite local identity such as `source + ":" + externalId`.
- API adapters must validate untrusted response data before persistence.

## Architecture
Feature-oriented React Native client:
- UI/screens/components
- navigation (Expo Router)
- state (Redux Toolkit)
- remote data adapters (Redux Toolkit thunks, see ADR-008)
- local persistence (SQLite repositories)
- secure session (SecureStore)
- network observer (NetInfo)
- image persistence (FileSystem)
- theme/design tokens

No custom backend in the assignment baseline. No secrets or permanent API credentials embedded in the app.

## Current implementation

The Expo app implements verified offline session restoration, protected routes, SQLite source snapshots, account-owned favourites and notes, and verified durable image downloads. Discover, Details, Favourites, and Profile follow the magazine design specifications. See `docs/PROGRESS.md` for the current build and device verification evidence.

## Space Study extension

Discover also opens the COSMOLOG Field Guide and object atlas. The first edition includes eight original chapters, 112 object profiles and a bundled city index. Study reading, city selection, bookmarks and account notes work locally after session restoration. The separate sky viewer can identify supported study objects and use recent cached orbital elements. See docs/PROGRESS.md for the release evidence.

## Cumulative product expansion (planned, 2026-11-26)

All twelve features in [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md) are accepted as cumulative scope: Expedition Packs, Offline Library Manager, LightTrace, Cosmic Scale Laboratory, Advanced Field Notes, Celestial Field Instrument, Behind the Discovery, One Sky Many Stories, Personal Sky Timeline, Meteor Calendar, Read Aloud and Night Observation Mode. Main currently declares v1.1.1; roadmap begins at v1.2.0 and reuses existing packs, study atlas, sensors, account notes, recognition, search and history. Preserve magazine design, thunks, local ownership and current working app. No custom backend. See [feature catalogue](docs/FEATURE_CATALOG.md), [expansion architecture](design/EXPANSION_ARCHITECTURE.md) and [release tasks](tasks/releases/README.md). Only verified releases are shipped; defer remaining optional work after the assignment deadline rather than jeopardize core requirements.
