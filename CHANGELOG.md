# Changelog

This file records the existing published release baseline and planned work separately. GitHub release notes are authoritative for historical details. Do not assign a release date or version to unverified work.

## Unreleased — v1.2.0 (Offline Explorer)

- **F01 Expedition Packs:** Structured, multi-step science expeditions (Saturn, Apollo) combining NASA APOD celestial plates, Space Study literature chapters, and observational fieldwork prompts. Sourced credits, schema migration 15 for account-owned progress (`expedition_progress` with `revision`), and download orchestrator with storage preflight checks, explicit cancellation, and resumption.
- **F02 Offline Library Manager:** Dedicated storage and ownership management surface (`/offline-library`) accessible from Profile and Field Shelf. Physical disk deduplication, honest telemetry distinguishing physical on-disk media, installed Space Study curriculum text records, and unowned cache. Preflight preview and safe cache cleaning coordinated with the active media worker (`waitForMediaWorker`), preserving all user-owned records.
- **Strict Engineering Hardening Pass:**
  1. Decoupled expedition download availability from learning completion (downloading an article does not automatically mark it as read or completed).
  2. Evaluated expedition completion strictly by required steps (`completedRequiredCount >= totalRequiredCount`), tracking optional observational steps independently.
  3. Reused canonical media-policy and `mapSavedMedia` validation in Offline Library Manager without duplicating or weakening image-license checks; prohibited licenses degrade safely to `text-only`.
  4. Coordinated cache cleanup with the active media download worker (`waitForMediaWorker`) to prevent race conditions and concurrent file pruning.
  5. Honestly labelled and distinguished physical media bytes on disk, installed Space Study text curriculum records, and reclaimable cache storage.
  6. Persisted `revision` in SQLite `expedition_progress` and reconciled compatible step progress upon manifest updates.
  7. Implemented explicit download cancellation (`work.current?.abort()`) and safe resumption.
  8. Made expedition source credits actionable and accessible with $\ge 48\text{ dp}$ touch targets via `Linking.openURL`.
  9. Verified account isolation, logout during asynchronous work, shared file retention across accounts, schema migration safety, and offline cold restarts.
  10. Expanded automated test suite to 43 test suites, 168 tests (100% passing). Verified on self-contained Android build in airplane mode on Pixel 9 emulator.

## Existing published releases

- [v1.1.1 — Launch refresh](https://github.com/Suthankan1/cosmolog/releases/tag/v1.1.1)
- [v1.1.0 — The discovery edition](https://github.com/Suthankan1/cosmolog/releases/tag/v1.1.0)
- [v1.0.0 — The magazine edition](https://github.com/Suthankan1/cosmolog/releases/tag/v1.0.0)

The main branch snapshot was inspected on 2026-11-26. It declares 1.1.1 and contains additional work documented in docs/PROGRESS.md; do not infer every main-branch change is in the published APK.
