# COSMOLOG user flows

## Authentication
App launch → SecureStore session read → valid token? → Discover : Login.
Login success → save token securely → fetch user profile → Discover.
Registration → validate → DummyJSON simulated create → return to Login with clear demo notice.
Logout → clear token + auth state → Login.

## Discovery and save
Discover local cache render → optional network refresh → choose item → Details loads by source + ID → Save → persist favourite row → persist image file if image exists → show saved feedback.

## Offline
Device loses network → NetInfo emits connectivity change → show offline banner → read local DB only → saved content remains available.
Cold start offline → read SQLite → render last cached list and favourites → no network spinner blocking local content.
No cache yet → clear first-run offline explanation; no fabricated content.

## Reconnect
Connectivity returns → debounce event → refresh current feeds → validate/normalize → transactionally upsert items → update lastSyncedAt only after successful commit → preserve favourite rows → remove duplicate records by composite identity.

## Details routing
`/details/[source]/[itemId]`; pass only IDs and source. Details queries repository/API. Favourites can route to same detail screen.

## State model
Network state: `online | offline | unknown`.
Content freshness: `fresh | stale | unavailable`.
Request state: `idle | loading | success | error`.
These are distinct dimensions; do not compress into one boolean.
