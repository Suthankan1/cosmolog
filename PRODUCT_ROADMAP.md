# COSMOLOG — Product roadmap

**Planning date:** 2026-11-26 · **Baseline:** main at 971df1033ac3349edbfa95d8debc93700e893646 · **Published baseline:** v1.1.1 (Launch refresh).

COSMOLOG evolves from an editorial offline archive into a local-first science exploration, observation and personal research companion. All twelve selected capabilities are approved product scope; none is represented as delivered by this roadmap. A release adds working vertical slices and retains all earlier functionality. The assignment is an independent stable milestone, not a requirement to ship every expansion by its deadline.

## Repository evidence and scope reconciliation

Read the existing [README](README.md), [architecture](design/ARCHITECTURE.md), [data model](design/DATA_MODEL.md), [progress](docs/PROGRESS.md) and [decisions](docs/DECISIONS.md). The baseline has Expo SDK 58, React Native 0.88.1, TypeScript, Redux Toolkit thunks (ADR-008), SQLite migration 14, Astronomy Engine, satellite.js, Expo Sensors/Location, native speech recognition and a checked-in Android project. The README and progress log report extensive tests and device checks; this documentation audit did not run them.

Existing capabilities to extend, not replace: archive search, reading position/history, collections, dated NASA plates, On This Day, native share, account-owned article notes, voice search/dictation, offline reading packs, versioned Space Study supplements, bundled city index and Sky Viewer with local astronomy and satellite predictions. Current visual truth is the **magazine edition** in the app and design/magazine; the original Figma V2 is historical.

| ID | Feature | Baseline evidence | Target |
|---|---|---|---|
| F01 | Expedition Packs | Partial: reading packs + study download infrastructure | v1.2.0 |
| F02 | Offline Library Manager | Partial: Profile counts, per-item media state, pack removal | v1.2.0 |
| F03 | LightTrace | Related: HYG estimated distances, study atlas | v1.3.0 |
| F04 | Cosmic Scale Laboratory | Related: study chapter content | v1.3.0 |
| F05 | Advanced Field Notes | Partial: favourite/study annotations + dictation; no independent observation journal located | v1.4.0 |
| F06 | Celestial Field Instrument | Partial: Sky Viewer pointing, manual controls, position math | v1.4.0 |
| F07 | Behind the Discovery | Related: curated study entries and source links | v1.5.0 |
| F08 | One Sky, Many Stories | Related: star catalog and chart; no cultural overlays located | v1.5.0 |
| F09 | Personal Sky Timeline | Partial: saved dates/reading history; no combined timeline located | v1.6.0 |
| F10 | Meteor Calendar | No dedicated route located | v1.6.0 |
| F11 | Read Aloud | Voice-to-text exists; speech synthesis is separate | v1.7.0 |
| F12 | Night Observation Mode | Forest chart exists; no dedicated red theme located | v1.7.0 |

"Partial" and "related" describe static repository evidence, not verified runtime completion. Check the current code before taking a task.

## Cumulative releases

| Release | Theme | Increment | Prerequisite |
|---|---|---|---|
| v1.1.1 | Existing archive | Retain published implementation | Baseline regression audit |
| v1.2.0 | Offline Explorer | F01–F02 | Ownership and file retention tests |
| v1.3.0 | Beyond Time and Scale | F03–F04 | Sourced data + pure math tests |
| v1.4.0 | Field Observer | F05–F06 | Account migration + safe sensor capture |
| v1.5.0 | Science Behind Space | F07–F08 | Curated and licensed content |
| v1.6.0 | Your Cosmic Journey | F09–F10 | Observation journal + accurate calendar |
| v1.7.0 | Accessible Exploration | F11–F12 | Reading and theme audits |
| v2.0.0 | Integrated COSMOLOG | All twelve integrated, audited, release-ready | Every feature gate met; version milestone subject to release policy |

The previously discussed v1.1.0 expansion slot is already occupied by a real published release. These target versions intentionally advance from v1.1.1. Do not rewrite previous release tags.

## Deadline and workload

Assignment deadline: 13 December 2026, 23:59 (course local time). Proposed pre-submission sequence: Nov 26–29 baseline checks; Nov 30–Dec 2 v1.2 candidate; Dec 3–5 v1.3 candidate only if quality gates passed; Dec 6–8 v1.4 small text-only observation/instrument slice only if time permits; Dec 9–12 freeze, device QA, screenshots, README, 3-minute demo, submission. Dec 13 is submission buffer. Move unfinished optional releases/slices after submission; estimates are not commitments. Exams take priority; do not compress QA or overpromise release dates. v1.5–v1.7 and integration are planned follow-on releases. If baseline tests fail, fix them before enhancements.

## Entry points and implementation order

Read [feature catalogue](docs/FEATURE_CATALOG.md), [expansion architecture](design/EXPANSION_ARCHITECTURE.md), [data contracts](design/EXPANSION_DATA_CONTRACTS.md), [sources](docs/expansion/SOURCE_REGISTRY.md), [release strategy](docs/RELEASE_STRATEGY.md) and [task index](tasks/releases/README.md). The [master prompt](MASTER_IMPLEMENTATION_PROMPT.md) is the shared agent entrypoint. The roadmap does not authorize a big-bang rewrite, a new backend, fabricated data, new permission prompts at startup, or a change in existing release version.
