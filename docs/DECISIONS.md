# Architecture decision records

## ADR-001 — Expo + React Native + TypeScript
**Status:** Proposed.
**Decision:** Use Expo with React Native and TypeScript.
**Reason:** The brief permits Expo; it reduces native project setup while retaining access to native modules. Verify current SDK/module compatibility at project initialization.
**Trade-off:** Expo native modules and config plugins still require device/build validation; Expo Go may not represent final native behaviour.

## ADR-002 — SQLite as durable offline source
**Status:** Proposed.
**Decision:** Use Expo SQLite for cached content, favourites and sync metadata.
**Reason:** Assignment requires previously loaded list and favourites across restarts and offline use.
**Trade-off:** Requires schema migrations and explicit repository boundaries.

## ADR-003 — SecureStore for auth token
**Status:** Required.
**Decision:** Store auth token in Expo SecureStore only.
**Reason:** The brief explicitly disallows AsyncStorage/MMKV for tokens and requires OS-backed secure storage.
**Trade-off:** SecureStore is not a general database and must not hold the content cache.

## ADR-004 — Redux Toolkit + RTK Query
**Status:** Proposed.
**Decision:** Use Redux Toolkit; RTK Query for remote request lifecycle, with SQLite repositories as durable local data source.
**Reason:** Satisfies state-management requirement while avoiding confusion between network cache and durable offline storage.
**Trade-off:** Need clear invalidation/reconciliation between network and local records.

## ADR-005 — No custom backend
**Status:** Proposed.
**Decision:** Use DummyJSON and public space APIs directly.
**Reason:** No assignment requirement currently justifies a custom backend.
**Trade-off:** DummyJSON registration is simulated; explain this limitation.

## ADR-006 — Static launcher icon, animated in-app reveal
**Status:** Proposed.
**Decision:** Provide a static launcher asset and a short in-app Reanimated brand reveal after native splash.
**Reason:** Mobile operating systems control launcher icon rendering; a continuously animated launcher icon is not a normal cross-platform app capability.
**Trade-off:** Animation is an opening transition, not a continuously animated home-screen icon.

## ADR-007 — Local session continuity and protected routes

A verified DummyJSON identity and its tokens are stored together in SecureStore. Startup reads that record locally and opens protected routes immediately. Online validation can refresh or revoke the session. Service outages leave the existing local session usable. A sign-out marker takes precedence over older credential keys and conditional updates keep an in-progress validation from restoring a signed-out session. Legacy token-only installs need one online verification.

## ADR-008 — Source snapshots and Redux Toolkit thunks

The remote workflow keeps the repository's Redux Toolkit thunks. The coordinator hydrates SQLite before refreshing, and each source commits its feed membership and successful timestamp together. This gives cached content, source failures, reconnects, and local writes one reconciliation path without depending on a second in-memory remote cache.
