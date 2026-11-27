# Changelog

This file records the existing published release baseline and planned work separately. GitHub release notes are authoritative for historical details. Do not assign a release date or version to unverified work.

## v2.0.0 — Integrated COSMOLOG (2026-11-27)

COSMOLOG v2.0.0 is the complete, integrated release of all 12 planned Space & Science discovery and field exploration capabilities for IN3210 Assignment 2 (Student index `234202J`, Space & Science `2`, Offline-first `0`).

- **Full 12-Capability Integration (F01–F12):**
  - **F01 Offline Library & Storage Management:** Durable SQLite cache reconciliation, media provenance tracking, reclaimable disk space accounting, and shared-media retention locks.
  - **F02 Sourced Reading Packs & Expeditions:** 6 curated multimodal expedition packs with independent learning step progress separated from download retention, revision tracking (migrations 15 & 16), and cancellation safety.
  - **F03 LightTrace Laboratory:** Interactive astronomical speed of light simulator, lookback time calculator, logarithmic distance track ($1\,\text{AU}$ to $13.4\,\text{Gly}$), and lookback horizon boundary math.
  - **F04 Cosmic Scale Laboratory:** Relative scale comparisons, logarithmic planetary diameters, astronomical travel times at terrestrial vs relativistic speeds, and orbital approximations.
  - **F05 Independent Observation Journal:** Account-isolated observation logbook (migration 17) with optional eyepiece photo attachments and GPS coordinates (migration 18), private storage directory, and boundary validation.
  - **F06 Celestial Field Instrument:** Foreground-only sensor pointing pipeline, forest/brass compass rose bezel, inclination gauge, target tracking bearing calculation, and prominent solar observing safety warnings.
  - **F07 Sourced Evidence Dossiers:** Behind the Discovery readers with four ruled empirical blocks (Observation, Method, Inference, Uncertainty Boundaries) covering Webb WASP-39 b, Hubble Europa Plumes, and Keck/VLT Sgr A* black hole dynamics.
  - **F08 Licensed Sky Culture Overlays:** Multi-cultural celestial viewer covering Indigenous Arabic (*Al-Jawza'*) and Chinese Traditional (*Shen*) constellations mapped to Hipparcos bright stars with IAU Orion disclaimers.
  - **F09 Personal Sky Timeline:** Unified SQLite read projection combining observations, saved discoveries, reading history, and study bookmarks into a local timezone grouped chronology (`Asia/Colombo` +05:30) with undated reference marks.
  - **F10 Sourced Annual Meteor Calendar:** IMO and AMS verified annual meteor showers for 2026 with exact peak timezones, date-only peak preservation, radiant location deep linking, and idealized ZHR caveats.
  - **F11 Accessible Read Aloud:** Native speech synthesis (`expo-speech`) with sentence-bounded chunking, rate control ($0.8\times\text{--}1.5\times$), mutual exclusion with speech recognition, and iOS silent mode guidance.
  - **F12 Night Observation Mode:** Contrast-tested red-on-charcoal semantic theme (>13:1 text contrast, >4.8:1 heading contrast) for telescope dark adaptation, persisted via migration 20 in `reader_preferences` with quick toggle controls.

- **Architecture, Security & Accessibility Integrity:**
  - Strict account-isolated persistence across all SQLite tables (migrations 1 through 20).
  - OS-backed token storage via `expo-secure-store`; zero tokens in logs or Redux state.
  - Zero permission prompts on boot; sensor permissions requested only on explicit user tap.
  - Minimum touch targets $\ge 48\text{ dp}$ throughout the magazine interface.
  - 66 test suites with 381 automated tests passing at 100% pass rate.

## v1.7.0 — Accessible Exploration (2026-11-27)

- **F11 Accessible Read Aloud (Native Speech Synthesis):**
  - Native speech synthesis integration via `expo-speech` (`~58.0.4`) without requesting microphone permissions (output only).
  - Single central narration controller (`src/services/voice/narrationService.ts`) with lifecycle management, rate clamping ($0.5\times\text{--}2.0\times$), and rate selection presets ($0.8\times, 1.0\times, 1.25\times, 1.5\times$).
  - Sentence-bounded text chunking (<350 chars) preventing buffer exhaustion and word-boundary clipping.
  - Stale callback cancellation: session tokens incremented on every start/stop ensure discarded callbacks from superseded sessions never trigger state transitions.
  - Two-way mutual exclusion with speech recognition (`src/hooks/useVoiceToText.ts`): speech synthesis automatically stops before voice recognition begins, and voice recognition is paused when narration starts.
  - Automatic stop on screen unmount, route blur, or user logout.
  - Accessible `ReadAloudBar` component (`src/components/common/ReadAloudBar.tsx`) with $\ge 48\text{ dp}$ touch targets, progress indicators, iOS silent mode caveat notice, and publisher summary boundaries.
  - Integrated into Discovery Details reader (`app/details/[source]/[id].tsx`) and Evidence Dossier reader (`app/study/dossier/[id].tsx`).

- **F12 Night Observation Mode (Dark Red/Charcoal Theme):**
  - High-contrast charcoal/obsidian and dark red palette (`src/theme/tokens.ts`): background (`#0D0B0B`), surface (`#1A1414`), primary red heading accent (`#E64A38`), soft light-red ink (`#F2D6D3`), muted rose-gray (`#A8807C`), deep wine red chip background (`#2E1C1A`), and amber brass (`#E6A15C`).
  - Contrast-tested tokens: body text contrast ratio $> 13:1$ against background (exceeding WCAG AAA 7:1); primary red headings $> 4.8:1$ (exceeding WCAG AA 4.5:1). Preserves human eye dark adaptation at the telescope eyepiece without claiming medical guarantees.
  - Full visual parity in default editorial mode (`#F8F4EA` ivory / `#184235` forest / `#C1654A` terracotta / `#C79B4D` brass).
  - Schema migration 20 adding `reader_preferences` table (`account_id`, `theme`, `speech_rate`, `voice_id`, `updated_at`).
  - Durable account-isolated SQLite repository (`src/database/repositories/preferencesRepository.ts`), defaulting to editorial mode and resetting safely on logout.
  - Root application layout wrapped in `ThemeProvider` (`app/_layout.tsx`), dynamically adjusting system status bar style (`light` in night mode, `dark` in daytime editorial mode) and Stack canvas background.
  - Dedicated Profile settings toggle (`app/(tabs)/profile.tsx`) with clear disclaimer that system dialogs use OS appearance.
  - Fieldwork Hub quick toggle chip (`app/fieldwork/index.tsx`) for immediate activation and exit at the eyepiece.
  - Adaptive styling across navigation tabs, floating docks, common buttons, headers, and banners.

## v1.6.0 — Your Cosmic Journey (2026-11-27)

- **F09 Personal Sky Timeline (Account-Scoped Historical Chronology):**
  - Account-isolated SQLite read projection (`src/features/timeline/timelineRepository.ts`) unifying independent eyepiece observations (`observations`), saved discoveries (`favourites` JOIN `cached_items`), article reading history (`reading_history` JOIN `cached_items`), and study bookmarks (`study_bookmarks` JOIN `study_entries`).
  - Zero event log duplication; zero invented timestamps. Undated records (e.g. study bookmarks without timestamps) are honestly designated `dateKind: 'undated'` and ordered deterministically at the end of the timeline.
  - Stable composite cursor `(event_at, kind, source_id)` supporting smooth cursor pagination across dated and undated rows.
  - Timezone-aware date grouping engine (`src/features/timeline/timelineGrouping.ts`) with local midnight boundaries (including `Asia/Colombo` +05:30) grouping records into Today, Yesterday, formatted months (e.g. November 2026), and Undated Reference Marks.
  - Explicit labeling distinguishing user action dates (e.g. Saved / Read date) from publisher release dates without conflation.
  - Dedicated Personal Sky Timeline surface (`app/timeline/index.tsx`) with category filter chips (`All`, `Observations`, `Saved`, `Reading`, `Study`), color-coded event badges, and typed routing to `/fieldwork/[id]`, `/details/[source]/[id]`, and `/study/[id]`.
  - Linked entry points from Field Shelf (`app/(tabs)/favourites.tsx`) and Fieldwork Hub (`app/fieldwork/index.tsx`).

- **F10 Sourced Annual Meteor Calendar:**
  - Authoritative annual meteor shower dataset for 2026 (`src/features/events/data/meteors-2026.json`) covering 7 major annual showers (Quadrantids, Lyrids, Eta Aquariids, Perseids, Orionids, Leonids, Geminids) cross-checked between the International Meteor Organization (IMO S10) and American Meteor Society (AMS S11).
  - Strict preservation of source date precision: exact UTC peaks preserved where known; date-only peaks (e.g. Orionids) explicitly retained without fabricated hours.
  - Timezone conversion engine (`src/features/events/meteorFormatter.ts`) supporting half-hour offsets (`Asia/Colombo` +05:30) and automatic expiration warnings preventing silent annual peak reuse.
  - Prominent scientific caveat explaining that Zenithal Hourly Rate (ZHR) is an idealized rate under pristine skies with the radiant overhead, not a local visibility or weather forecast.
  - Accessible Meteor Calendar interface (`app/events/meteors.tsx`) with status badges (`PEAK ACTIVE NOW`, `ACTIVE SHOWER`, `UPCOMING`, `PAST`), quick observation logging linking directly to the observation journal, and radiant locator opening Sky Viewer (`/sky-viewer`).
  - Cross-feature observation linkage: field observations linked to meteor shower celestial targets (`meteor:<id>`) seamlessly integrate into the Personal Sky Timeline.
  - Entry points linked from Explore Hub (`app/explore/index.tsx`) and Fieldwork Hub (`app/fieldwork/index.tsx`).

- **F08 Licensed Cultural Sky Overlay Datasets (One Sky, Many Stories):**
  - Peer-reviewed sky culture overlay schema and validator (`src/features/sky/catalog/cultures/types.ts`) with Hipparcos catalog verification, segment topology validation, and explicit modern IAU boundary disclaimers.
  - Curated, versioned manifest (`src/features/sky/catalog/cultures/manifest.json`) covering the equatorial sky region:
    - Indigenous Arabic & Bedouin Sky Culture (*Al-Jawza'*, "The Central Queen"): based on Al-Sufi's *Book of Fixed Stars* and Paul Kunitzsch's scholarship, adapted from the Stellarium Sky Cultures project (Khalid AlAjaji, Georg Zotti) under CC BY-SA 4.0.
    - Chinese Traditional Twenty-Eight Mansions (*Shen*, 参宿, "Three Stars / Imperial Commander"): based on Han dynasty *Shiji* records and Sun Xiaochun & Jakob Kistemaker (1997) under CC BY-SA 4.0.
  - All star endpoints map directly to existing HYG Hipparcos entries in `bright-stars.json` with J2000.0 coordinates.
  - Dedicated comparison viewer and reader surface (`app/explore/cultures.tsx`) with interactive star chart, stable pixel projection (`src/features/sky/catalog/cultures/cultureProjection.ts`), non-gesture mode toggle (Al-Jawza', Shen, Compare Both), accessible star telemetry table, and explicit IAU Orion disclaimers.
  - Deep-linked entry points from Explore Hub (`app/explore/index.tsx`) and Sky Viewer (`app/sky-viewer.tsx`).
  - Offline repository layer (`src/features/sky/catalog/cultures/cultureRepository.ts`) and catalog documentation (`src/features/sky/catalog/README.md`).

- **F07 Sourced Evidence Dossiers (Behind the Discovery):**
  - Peer-reviewed empirical dossier schema and validation (`src/features/study/evidence.ts`) enforcing four ruled scientific blocks: empirical observation, method/instrumentation, scientific inference, and explicit negative boundary uncertainty (what evidence does NOT establish).
  - Three authoritatively sourced evidence dossiers (`src/features/study/evidenceData.ts`):
    - Webb WASP-39 b NIRSpec Transmission Spectroscopy: empirical 4.3 µm carbon dioxide ($CO_2$) absorption peak, explicitly distinguishing measured flux dips from artist renderings and disclaiming biological life or habitability inferences (NASA sources S07/S08).
    - Hubble Europa Plume Candidates: far-ultraviolet oxygen/hydrogen auroral emissions and limb transit silhouettes, disclaiming confirmed global ocean connectivity or steady-state cryovolcanism (NASA/STScI sources S12).
    - Keck & VLT Sagittarius A* Stellar Dynamics: two decades of near-infrared astrometry for star S2 enclosing $(4.15 \pm 0.13) \times 10^6\,M_\odot$, disclaiming direct event-horizon resolution without millimeter VLBI (Keck/ESO sources S12).
  - Dedicated Evidence Dossier reader surface (`app/study/dossier/[id].tsx`) and curated index (`app/study/dossiers.tsx`) with four ruled editorial blocks, verified peer review metadata, empirical data vs artist concept badges, and actionable primary citations with offline fallback.
  - Cross-feature deep linking from Space Study chapters (`app/study/[id].tsx`), Explore Hub (`app/explore/index.tsx`), and Sky Viewer celestial detail sheet (`src/features/sky/SkyDetailSheet.tsx`).

## v1.4.0 — Field Observer (2026-11-26)

- **F05 Independent Observation Journal (Advanced Field Notes):**
  - Durable account-isolated observation journal (`observations` table, schema migration 17) distinct from article and study annotations.
  - Opaque IDs, UTC observed time, IANA timezone preservation, qualitative conditions, celestial target association, and non-destructive foreign keys (`REFERENCES cached_items(local_id) ON DELETE SET NULL`).
  - Protected Fieldwork Hub (`/fieldwork`), Observation Creator (`/fieldwork/create`) with optional Sky Viewer prefill and voice-to-text dictation without boot prompts, and Detail/Editor (`/fieldwork/[id]`) with confirmed delete.
  - Durable SQLite repository (`src/database/repositories/observationsRepository.ts`) with input boundary validation, strict account isolation, and serialized write transaction queue.
  - Optional eyepiece photo attachments and observation site coordinates (`schema migration 18` adding `latitude`, `longitude`, `location_name`, `image_file_name`, `image_bytes`).
  - App-private observation photo storage (`src/services/storage/observationStorage.ts` in `cosmolog_observations/`), isolated from unowned API cache pruning, with <12 MB file bounds and automatic file cleanup on observation deletion.
  - Consent-based runtime GPS coordinate capture via `expo-location` and photo selection via `expo-image-picker` triggered only by explicit user button press; zero permission prompts on boot and zero external cloud uploads.
  - Geographical coordinate boundary validation ($-90^\circ$ to $+90^\circ$ latitude, $-180^\circ$ to $+180^\circ$ longitude) with ~11m precision rounding and optional site names.
- **F06 Celestial Field Instrument (Night Sky Guide & Observation Capture):**
  - Shared foreground-only sensor pointing pipeline (`src/features/sky/pointing.ts`, `src/features/sky/useSkyPointing.ts`) deriving azimuth, altitude, 16-point cardinal directions, magnetic vs true north reference frames, and magnetic interference bounds ($15\text{--}100\,\mu\text{T}$).
  - Dedicated Celestial Field Instrument screen (`/fieldwork/instrument`) featuring a forest dial (`#184235`), ivory numbers (`#F8F4EA`), brass compass rose bezel (`#C79B4D`), live inclination gauge, and accessible numeric scientific telemetry.
  - Interactive manual sighting mode with azimuth ($-15^\circ$, $-5^\circ$, $+5^\circ$, $+15^\circ$) and elevation ($-10^\circ$, $+10^\circ$) steppers and direct numeric entry for fixed telescope mounts or uncalibrated sensors.
  - Target tracking mode calculating real-time relative bearing and elevation offsets for celestial catalog bodies.
  - Prominent solar observing safety warning alerting users to never view or point optical instruments at the Sun without certified ISO 12312-2 filtration.
  - Explicit immutable snapshot capture (`InstrumentSnapshot`) persisted via schema migration 19 (`instrument_snapshot` column in `observations` table), strictly separating active device sensor readings from manual alignment without fabricated precision.
  - Deep linking from Sky Viewer detail sheet (`/sky-viewer`) directly into the Celestial Field Instrument.


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
