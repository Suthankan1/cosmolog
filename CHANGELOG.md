# Changelog

This file records the existing published release baseline and planned work separately. GitHub release notes are authoritative for historical details. Do not assign a release date or version to unverified work.

## v1.3.0 — Beyond Time and Scale (2026-11-26)

- **F03 LightTrace (Offline Cosmic Light-Travel Explorer):**
  - Interactive laboratory surface (`/explore/lighttrace`) investigating the finite velocity of light and observable lookback time delay across the universe.
  - Curated, versioned reference dataset (`src/features/labs/data/lighttrace.ts`) covering Moon (384,400 km), Sun (1 AU), Proxima Centauri (4.2465 ly), and Andromeda Galaxy (2.5 million ly), referencing authoritative metrological sources (BIPM, IAU, NASA JPL Basics of Space Flight).
  - Pure astronomical math module (`src/features/labs/lightMath.ts`): exact vacuum speed of light ($c = 299,792,458\text{ m/s}$), IAU distance constants (AU, ly, pc), Euclidean lookback delay ($t = d/c$), duration formatting, and logarithmic cosmic scale normalization.
  - Interactive controls: celestial target tabs, previous/next stepper buttons, logarithmic distance track indicator, measurement details table, and scientific disclosure regarding flat vacuum space vs high-redshift cosmic expansion.
  - Actionable external source links ($\ge 48\text{ dp}$ touch targets via `Linking.openURL`), and deep links to related Space Study chapters and Sky Viewer celestial targets.
  - Explore Hub screen (`app/explore/index.tsx`) with magazine editorial styling and accessible navigation card from Discover tab.
- **F04 Cosmic Scale Laboratory (Planetary Diameters & Travel Time Simulator):**
  - Interactive scale comparison and travel simulator laboratory surface (`/explore/scale`) with Diameter, Distance, and Travel Time modes.
  - Curated authoritative dataset (`src/features/labs/data/scale.ts`) for Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, and Saturn citing NASA Planetary Fact Sheets (S05) and BIPM standard (S01).
  - Strict physical convention: volumetric mean diameter in km, clearly separated heliocentric semi-major axis (AU/km) from geocentric variable distance (mean, closest approach, conjunction).
  - Pure scale math engine (`src/features/labs/scaleMath.ts`): relative diameter ratios against selectable reference bodies (default Earth), proportional schematic comparison bars, and constant-speed straight-line travel times ($t = d/v$).
  - Physical boundary validation: strictly rejects speeds $\ge c$ and non-positive speeds/distances. Discloses straight-line Euclidean scope vs curved Keplerian orbital mechanics.
  - Speed presets (Commercial Jet, Voyager 1, Parker Solar Probe, 0.1c) plus custom speed input with live validation.
  - Cross-feature deep links to Space Study chapters (`/study/[id]`), Expeditions (`/reading-packs`), and Sky Viewer (`/sky-viewer`).


## v1.2.0 — Offline Explorer (2026-11-26)

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
- **Migration & Media Safety Blocker Correction:**
  1. *Database Migration Safety (Migration 16):* Safely introduced schema migration 16 supporting both unmodified v15 schemas (where `revision` column was missing from `expedition_progress`) and modified v15 schemas (where `revision` had already been added). The runner queries `PRAGMA table_info(expedition_progress)` before applying `ALTER TABLE expedition_progress ADD COLUMN revision INTEGER NOT NULL DEFAULT 1; PRAGMA user_version = 16;`, preserving all existing user progress, field notes, and bookmarks. Maximum supported version check raised to 16. Added comprehensive SQLite tests covering fresh install (0 -> 16), upgrade from v14, upgrade from unmodified v15, upgrade from modified v15, and transaction rollback.
  2. *Exclusive Media Lock Coordinator:* Implemented reusable, promise-queue mutual exclusion service (`withExclusiveMediaLock`, `waitForMediaOperations`, `isMediaOperationInProgress`) in `src/services/storage/mediaCoordinator.ts`. Serializes media downloads, reconciliation, and filesystem pruning without importing Redux internals into storage domain. Added deterministic concurrency tests using deferred promises.
  3. *Truthful Physical Storage Accounting & Active Owner Protection:* Accurately deduplicated physical media on disk (`deviceTotalMediaBytes`, `accountMediaBytes`, `sharedMediaBytes`, `reclaimableMediaBytes`). Excluded files referenced by ANY retained owner across all accounts from reclaimable storage. Updated `pruneImageFiles` to return exact deletion metrics (`deletedBytes`, `deletedFiles`) rather than assumptions. Labeled study supplements as "content size" rather than disk usage.
  4. *Strict Independence of Learning Progress from Downloads:* Completely decoupled removing expedition downloads from learning progress. Tapping "Remove download" purges offline cached reading pack plates while keeping `expedition_progress` checkmarks 100% intact. Introduced an explicit, separate "Reset progress" action with confirmation alert dialog.
  5. *Native Android Upgrade Verification:* Upgraded an existing pre-hardening installation on Android Pixel 9 emulator without clearing application data (`adb install -r`). Verified complete survival of existing favourites, private notes, cached discoveries, expedition progress, offline access, and storage telemetry. Full test suite: 45 test suites, 179 tests (100% passing).
- **Expedition Manifest Boundary Validation & Revision-Aware Readiness (Issue #10):**
  1. *Discriminated Step Union & Strict Boundary Validation:* Implemented `z.discriminatedUnion('kind', ...)` for `discovery`, `study`, and `prompt` steps in `src/features/expeditions/manifest.ts`. Added strict calendar date validation (`isValidCalendarDate`) verifying real month/day rules (including leap years), upper/lower bounds (APOD starts 1995-06-16), and matching canonical discovery IDs (`nasa-apod:${date}`). Verified study chapter existence and section anchor slugs (`isValidStudyTarget`), non-empty prompt instructions, unique step IDs, unique step orders, unique discovery target IDs, and bounded byte estimates ($\le 500\text{ MB}$).
  2. *Upstream Source & Study Metadata Verification:* Audited Saturn and Apollo expeditions against authoritative NASA APOD archives and Space Study curriculum data. Corrected section anchor slugs for Saturn (`rings`) and Apollo (`phases`).
  3. *Study Navigation & Anchor Resolution:* Resolved section anchors in `app/study/[id].tsx` and `src/features/study/edition.ts` (`sectionNumber`) supporting both slugs and section titles. Allowed `readStudy` to resolve both `id` and `chapter:${id}` transparently. Navigated from expedition cards with typed params `{ id: chapterId, section: step.sectionAnchor }`.
  4. *Revision-Aware Readiness Telemetry:* Implemented `computeExpeditionReadiness` in `src/features/expeditions/manifest.ts`. Evaluates required target availability across discovery text, media images, and study guides independently. Prevents unrelated or old cached rows from falsely inflating readiness.
  5. *Expeditions Repository Reconciliation:* Added `minCompatibleRevision` support in `getExpeditionCompletedStepIds` and `getAllCompletedStepIds`, automatically pruning orphaned steps and incompatible historical revisions while preserving compatible learning progress.
  6. *Storage Preflight & Cancellation Safety:* Calculated remaining bytes for uninstalled discovery steps during download preflight, skipped already installed steps on resume, and guarded callback execution against stale abort signals. Full test suite: 45 test suites, 188 tests (100% passing).

## Existing published releases

- [v1.1.1 — Launch refresh](https://github.com/Suthankan1/cosmolog/releases/tag/v1.1.1)
- [v1.1.0 — The discovery edition](https://github.com/Suthankan1/cosmolog/releases/tag/v1.1.0)
- [v1.0.0 — The magazine edition](https://github.com/Suthankan1/cosmolog/releases/tag/v1.0.0)

The main branch snapshot was inspected on 2026-11-26. It declares 1.1.1 and contains additional work documented in docs/PROGRESS.md; do not infer every main-branch change is in the published APK.
