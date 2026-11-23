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
