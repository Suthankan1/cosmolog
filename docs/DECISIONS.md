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
