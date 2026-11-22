# Task 04 — SQLite and offline-first twist

This is the highest-risk/highest-value assignment feature.

1. Design schema and migrations.
2. Implement repositories.
3. On app launch, render local feed and favourites first.
4. Fetch remote only when online.
5. Validate/normalize before upsert.
6. Persist last successful sync only after DB transaction.
7. Persist favourites across restarts.
8. Persist image files for favourites if guaranteed offline imagery is promised.
9. Show offline banner and stale timestamp.
10. Reconnect refresh without duplicates.
11. Add first-run offline empty-cache state.

Acceptance test: load feed, save 3 items, terminate app, enable airplane mode, relaunch, open feed/favourites/details and verify cached text/images remain available. Reconnect and verify refresh preserves favourite relationships.
