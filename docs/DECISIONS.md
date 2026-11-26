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

## ADR-017 — Cumulative local-first expansion

**Status:** Proposed for review. **Decision:** plan the twelve approved features in PRODUCT_ROADMAP.md as successive releases starting at v1.2.0, extending the current magazine app, existing Redux Toolkit thunks, account-scoped SQLite, pack/Study pipelines, Sky Viewer and private notes. No custom backend or duplicate cache. Public scientific content uses sourced/versioned local datasets; private observations remain on-device. Keep the three-tab dock and add protected hubs first, pending navigation UX review. **Trade-off:** incremental migration, source/license review, shared media retention and device QA are essential; not all optional features can safely ship before the assignment. Full release gates are documented in docs/RELEASE_STRATEGY.md. Actual detailed schema, dependencies, and navigation decisions require implementation evidence/review; this ADR is not a runtime change.

## ADR-018 — Expedition Packs composition and offline retention

**Status:** Accepted (Amended with v1.2.0 Hardening).
**Decision:** Evolve reading packs into structured multi-step ExpeditionManifests (composed of celestial plates, Space Study literature chapters, and observational fieldwork prompts) with backward-compatible pack IDs. Discovery plates download into `cached_items` and `reading_pack_items`, study steps integrate existing `study_entries`, and prompt steps guide sky observations. Account-scoped step completion is persisted additively in SQLite schema version 15 (`expedition_progress` with `revision`).
**Hardening Amendments:**
- Decouple download availability from learning completion: downloading an expedition installs the plates into `reading_pack_items` for offline readiness without modifying `expedition_progress`.
- Completion criteria strictly requires completing all required steps (`completedRequiredCount >= totalRequiredCount`), allowing optional observational prompts to remain incomplete without blocking expedition completion.
- Reconcile step progress against manifest revisions: manifest lookups filter out orphaned step IDs from older revisions while preserving completed IDs that match the current manifest.
- Provide explicit download cancellation via `AbortController` signal and deterministic resumption without orphan records.
**Reason:** Creates cohesive, curated scientific learning journeys that combine telescope/probe imagery, reference theory, and hands-on observation while reusing the validated media download pipeline, license policies, and storage quotas without a custom backend.
**Trade-off:** Requires mapping composite steps while retaining the existing `reading_pack_items` schema, media owner views, and backward-compatible route parameters. Removing an expedition download never cascades to delete user favourites, notes, or study bookmarks.

## ADR-019 — Offline storage projection and verified file retention

**Status:** Accepted (Amended with v1.2.0 Hardening).
**Decision:** Build a unified read-only storage and ownership projection (`offlineStorageProjection.ts`) across `saved_media`, `favourites`, `reading_pack_items`, and `study_packs`. Total physical bytes are calculated by verifying unique on-disk files via `imageStorage.ts`, preventing duplicate counting when multiple bookmarks or packs reference the same file. Cache clearing is restricted strictly to unowned discovery media where no account holds a favourite or reading pack reference.
**Hardening Amendments:**
- Honestly label and separate storage metrics: distinct fields for `physicalMediaBytes` (verified deduplicated image binaries on disk), `installedStudyTextBytes` (SQLite curriculum text records), and `reclaimableMediaBytes` (unowned cache binaries).
- Reuse canonical `mapSavedMedia` policy validation from `mediaRepository.ts` to ensure exact license matching (`row.license_url === row.image_license_url`) and prevent unauthorized image retention; prohibited licenses degrade safely to `text-only`.
- Coordinate cache cleanup with the media download worker by awaiting `waitForMediaWorker()` before evaluating eligible files and pruning disk storage, preventing race conditions during active downloads.
**Reason:** Provides users with honest, transparent insight into storage consumption, distinguishes device-wide shared supplements from account-owned items, and guarantees that cleanup operations cannot corrupt or delete user favourites, field notes, or expedition media.
**Trade-off:** File existence and size checks require synchronous or fast file-system inspections during telemetry calculation; disk deduping requires tracking seen filenames.
