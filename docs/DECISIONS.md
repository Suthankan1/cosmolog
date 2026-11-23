# Architecture decision records

## ADR-001 — Expo + React Native + TypeScript
**Status:** Accepted.
**Decision:** Use Expo with React Native and TypeScript.
**Reason:** The brief permits Expo; it reduces native project setup while retaining access to native modules. Verify current SDK/module compatibility at project initialization.
**Trade-off:** Expo native modules and config plugins still require device/build validation; Expo Go may not represent final native behaviour.

## ADR-002 — SQLite as durable offline source
**Status:** Accepted.
**Decision:** Use Expo SQLite for cached content, favourites and sync metadata.
**Reason:** Assignment requires previously loaded list and favourites across restarts and offline use.
**Trade-off:** Requires schema migrations and explicit repository boundaries.

## ADR-003 — SecureStore for auth token
**Status:** Required.
**Decision:** Store auth token in Expo SecureStore only.
**Reason:** The brief explicitly disallows AsyncStorage/MMKV for tokens and requires OS-backed secure storage.
**Trade-off:** SecureStore is not a general database and must not hold the content cache.

## ADR-004 — Redux Toolkit + RTK Query
**Status:** Superseded by ADR-008.
**Decision:** Use Redux Toolkit; RTK Query for remote request lifecycle, with SQLite repositories as durable local data source.
**Reason:** Satisfies state-management requirement while avoiding confusion between network cache and durable offline storage.
**Trade-off:** Need clear invalidation/reconciliation between network and local records.

## ADR-005 — No custom backend
**Status:** Accepted.
**Decision:** Use DummyJSON and public space APIs directly.
**Reason:** No assignment requirement currently justifies a custom backend.
**Trade-off:** DummyJSON registration is simulated; explain this limitation.

## ADR-006 — Static launcher icon, animated in-app reveal
**Status:** Accepted.
**Decision:** Provide a static launcher asset and a short in-app Reanimated brand reveal after native splash.
**Reason:** Mobile operating systems control launcher icon rendering; a continuously animated launcher icon is not a normal cross-platform app capability.
**Trade-off:** Animation is an opening transition, not a continuously animated home-screen icon.

## ADR-007 — Local session continuity and protected routes

A verified DummyJSON identity and its tokens are stored together in SecureStore. Startup reads that record locally and opens protected routes immediately. Online validation can refresh or revoke the session. Service outages leave the existing local session usable. A sign-out marker takes precedence over older credential keys and conditional updates keep an in-progress validation from restoring a signed-out session. Legacy token-only installs need one online verification.

## ADR-008 — Source snapshots and Redux Toolkit thunks

The remote workflow keeps the repository's Redux Toolkit thunks. The coordinator hydrates SQLite before refreshing, and each source commits its feed membership and successful timestamp together. This gives cached content, source failures, reconnects, and local writes one reconciliation path without depending on a second in-memory remote cache.

## ADR-009 — Account-owned Field Journal

Favourites and notes use the verified DummyJSON user ID as their owner. Shared source records avoid duplicating the feed. Legacy bookmarks have no owner, so the app preserves them for an explicit one-time import instead of silently assigning them. Android backup is disabled so notes and cached media stay on the device.

## ADR-010 — Verified and licensed offline media

The bookmark transaction completes independently of the image download. The worker validates file type, size, and local presence, and only downloads content with supported image rights. Store publisher links, credits, and available license URLs with the item so users can see the original context.

## ADR-011 — Smart Reading on the local archive

Keep SQLite and the existing Redux Toolkit thunks. Store the image's source revision alongside its file and store one paragraph checkpoint per verified account. Keep dated lookups separate from feed membership. Start with a bounded local search so reader progress, search, and date lookup work offline without a new library or backend.

## ADR-012 — Reading packs share the offline archive

Persist completed pack entries per account in SQLite. Commit each entry with its cached discovery so a failed request leaves completed entries available and retry can skip them. Share the existing licensed image files and download worker between packs and bookmarks. A file remains eligible for retention while any account has a pack entry or favourite referring to it. Packs use the existing date adapter and preserve the source snapshot, so they need no new dependencies or service.

## ADR-013 — Calculate the sky on the device

Use Astronomy Engine and small attributed HYG and OpenNGC catalog extracts to calculate sky positions without a network request. A React Native chart and object list share the same local data and detail sheet. Device time and coordinates determine the sky. Phone motion changes only the viewing direction. Use Expo Location and Expo Sensors for foreground pointing, with manual controls available when the compass or location is unavailable. Keep device coordinates and sensor readings in memory on the viewer.

Use `satellite.js` 6.0.2 for SGP4 propagation of ISS and Hubble elements from CelesTrak. Store validated elements and fetch timing in the existing SQLite database, and use the app's Redux Toolkit thunk pattern for refresh. Show the epoch and hide expired predictions. Cache and refresh remain independent of the astronomy catalog and article feeds.

## ADR-013 — Space Study editions and offline city lookup

Use the archive SQLite writer for versioned study records, aliases, account bookmarks and reading positions. Keep existing discovery identities and orbital elements intact. Bundle a separately indexed GeoNames database to avoid constructing the worldwide place index at startup. Study routes carry stable record IDs. Optional study packs share the archive transaction boundary. Keep the existing Redux Toolkit thunk approach for remote work.

## ADR-014 — Platform materials for navigation and sky controls

Use Expo SDK 58's expo-glass-effect for the floating tab bar and manual sky toolbar on supported Apple devices. Check native availability and Reduce Transparency before rendering glass. Use an elevated opaque surface elsewhere. Keep Expo Router's JavaScript tabs for Feather icons and existing navigation semantics. Opaque reading surfaces preserve legibility and keep material rendering out of repeated list items.

## ADR-015 — Magazine cover and launch identity
Use the approved magazine C throughout the launcher, masthead and five-second cold-launch sequence. Keep the existing Reanimated and Expo Image dependencies. Source editions are projections of the local feed. The new presentation requires no database migration.

## ADR-016 — Paginated dispatches and hybrid archive search

Keep Redux Toolkit thunks (ADR-008), the serialized SQLite writer and the native FlatList. Store validated pages and continuations atomically so refresh and interrupted pagination preserve offline reading. Keep search membership separate from editorial feed membership. NASA's public media catalogue extends in-app topic coverage. A user-initiated browser search covers the broader web without a hosted proxy or provider credentials.
