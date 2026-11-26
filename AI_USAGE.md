# AI usage record

This file must be updated honestly throughout development.

## Tools used
- ChatGPT: product concept, assignment interpretation, initial architecture and project documentation.
- Figma integration: authored COSMOLOG brand identity, editable mark, token collection, typography styles, component references, screen wireframes and system-state board.
- Other coding agents (Claude, Codex, Antigravity, Copilot, Cursor): add exact tool/version, date, task and files changed when actually used.

## Online discovery implementation

Codex implemented dispatch pagination, SQLite search snapshots, NASA media support and regression tests. A live Europa query returned HTTP 400 for the suggested secondary news ordering. Removing the unsupported field produced a successful paginated response. NASA returned an HTTP continuation URL, so the adapter constructs the next HTTPS request from the page number.

## Required correction log
The assignment requires at least one example where AI output was corrected or changed and why. Do not invent this entry. Add a real example after a generated suggestion is reviewed and corrected.

| Date | Tool | Initial output | Student correction | Why it was changed | Evidence |
|---|---|---|---|---|---|
| 2026-11-22 | Antigravity | Suggested synchronous RNTL `render(<Icon ... />)` in unit tests | Updated test to `await render(...)` for React Native Testing Library v14 | In RNTL v14 with React 19, `render()` is an asynchronous function returning a Promise. Synchronous invocation returned an empty unmounted object. | `tests/Icon.test.tsx` |
| 2026-11-22 | Antigravity | Attempted calling `FileSystem.documentDirectory` on root `expo-file-system` import | Switched import to `expo-file-system/legacy` for document directory and downloadAsync | In Expo SDK 58, `expo-file-system` restructured the default export around class-based `Paths` and `Directory`; the legacy export retains stable URI-based methods. | `src/services/storage/imageStorage.ts` |
| 2026-11-22 | Antigravity | Reanimated 4 Jest runner threw `[Reanimated] setCSSEventHandler is not available in JSReanimated` | Configured a self-contained Reanimated Jest mock in `tests/setup.ts` | Reanimated 4 introduces Worklet CSS event handlers that crash under Node test environments without native bindings. | `tests/setup.ts` |
| 2026-11-22 | Antigravity | Jest failed loading Immer ESM dependency inside Redux Toolkit | Added `immer|redux|@reduxjs` to `transformIgnorePatterns` in `jest.config.js` | Jest required transform configuration to process ESM modules bundled by Redux Toolkit in modern Node. | `jest.config.js` |

## Student responsibility
AI-generated code must be understood, run, reviewed and tested by the student. The student must be able to explain architectural decisions in the demo.

## 2026-11-22 — Figma redesign iteration
The original generated Figma v1 was criticised as unacceptable. ChatGPT rebuilt a v2 visual identity and multiple screens from the newer image references, corrected identified typography collisions, and changed the documented theme to Playfair/Inter and the reference palette. This is an actual AI-iteration record. Before submitting AI_USAGE.md, the student must review it, add their own precise corrections and supporting evidence, and keep only claims they can verify.

## 2026-11-23 — Offline-first hardening and Field Journal

Codex audited the existing startup, data and UI flows, implemented the feature slices, and wrote regression tests. One correction followed live API inspection. The working image policy originally recognized only NASA-owned credits. NASA’s current Jupiter APOD returned an explicit Creative Commons license in its credit HTML. The adapter now preserves a validated license URL, and the media worker can download licensed images while keeping their credit and license visible. This also avoided treating a NASA host as proof of image rights.

Native testing also exposed two shortcomings in the AI-assisted implementation. Protected routes left a signed-out cold launch at an unmatched root URL, so an explicit entry route now redirects after session restore. The inline note input could open below Android's keyboard, so editing now uses its own safe-area-aware compose view. Both corrections were retested on the release build.

## 2026-11-23 — Smart Reading refinement

Codex implemented the checkpoint, search and APOD date lookup. During Android testing the date form's action could sit below the keyboard inside the Discover list header. The form moved into a dedicated keyboard-aware modal. A second adjustment records the paragraph visible inside the viewport so short articles can also establish a checkpoint.

## 2026-11-23 — Archive extensions

Codex implemented Field Shelf collections, reading history, On This Day, native sharing, and offline reading packs. The first draft of the pack retry test used a matcher absent from the installed Jest version. TypeScript and Jest both flagged it. The revised test verifies the call count and its arguments with supported matchers in `tests/readingPacks.test.ts`.

## 2026-11-23 — Sky Viewer

Codex implemented the offline sky chart, location and phone pointing, and a SQLite cache for ISS and Hubble predictions. Expo config introspection exposed a conflict in the generated iOS permissions. The first version removed the motion usage description through the location plugin, so the sibling sensors plugin's description was missing from the resolved Info.plist. The revised configuration sets the same motion purpose in both plugins. Introspection confirmed the motion and foreground location strings in the final config.

## Space Study

AI assisted with drafting original guide text, connecting the reader and sky atlas, generating the GeoNames importer, and writing migration and pack tests. A chapter-index-only checkpoint was revised to use stable section identifiers so reordering a later edition can preserve the reader’s place. The content checks cover missing links, sources, section identifiers, section order and pack integrity. Student scientific and editorial review of the new guide remains required before submission.

During Android verification a pack installation failed because an Expo file write was still pending at checksum time. The installer now awaits the native write and verifies SHA-256. A delayed-write test reproduces the timing condition. The student must review the data licensing, source material and narration before submission.

## Platform control refresh

Codex implemented the platform surfaces, destination groups and shared button changes. During emulator testing, a tab’s generated accessibility name included the decorative Feather glyph. The corrected implementation gives each destination an explicit accessibility label and hides decorative icon text from assistive technology.

## Magazine redesign

Codex helped implement the cut-C artwork, the timed launch sequence, compact tab sizing and shared edition layout. The team should review the logo at launcher size and exercise Skip and Reduce Motion on a physical device. The editable SVG handoff includes local publication imagery. The connected Figma account had view access to the original design.

## Launch motion revision

Codex helped trace the five-second launch, prepare the credited Apollo 17 cutout, and implement the shorter reveal. The student selected a forest field and the one-second timing. The implementation uses native image display and route layout to coordinate the transition, replacing the previous independent completion timer.

## Voice-to-text (search and field note dictation)

Antigravity designed and implemented the full voice-to-text feature using `expo-speech-recognition` (the community TurboModule wrapping native `SpeechRecognizer` on Android and `SFSpeechRecognizer` on iOS). The initial draft placed `ref.current` assignments in the hook render body. ESLint 9 with the `react-hooks/refs` rule flagged all three assignments as render-time side effects. The corrected implementation wraps those updates in a `useEffect` with the callback as a dependency. A second correction followed during RNTL v14 hook testing: the first mock for `useSpeechRecognitionEvent` pushed listeners into a bare array without cleanup, so successive re-renders accumulated duplicate handlers and test assertions saw double emissions. The revised mock uses `React.useEffect` for registration and an unsubscribe return to mirror the real hook lifecycle. A third correction replaced a non-existent `radii.full` design token with the documented `radii.pill` (999) token from `src/constants/tokens.ts`. All 128 tests pass after these corrections. The Android native build was verified with `assembleDebug` (BUILD SUCCESSFUL). On-device microphone permission, voice search and dictation must be verified by the student on a physical device or running emulator.

| Date | Tool | Initial output | Student correction | Why it was changed | Evidence |
|---|---|---|---|---|---|
| 2026-11-26 | Antigravity | Set `onTranscriptRef.current` in render body of `useVoiceToText` | Moved all three ref updates into a `useEffect` | ESLint 9 `react-hooks/refs` disallows ref mutation during render | `src/hooks/useVoiceToText.ts` |
| 2026-11-26 | Antigravity | `useSpeechRecognitionEvent` mock used bare array push without cleanup | Reimplemented mock with `React.useEffect` for registration/unregistration | Duplicate listeners accumulated across re-renders, causing double emissions in tests | `tests/setup.ts` |
| 2026-11-26 | Antigravity | Used `radii.full` for mic button border radius | Replaced with `radii.pill` | `radii.full` does not exist in the COSMOLOG token system; only `radii.pill` (999) is defined | `src/components/discovery/SearchBar.tsx`, `src/features/journal/FieldNote.tsx` |

## 2026-11-26 — Expansion planning

ChatGPT inspected the actual repository using GitHub, compared the uploaded research/approved feature roadmap with existing code, and drafted the proposed release specs, architecture, source registry, task checklists and coding-agent prompt. It corrected the planning assumption that the project was still a starter and that RTK Query should be introduced, because main already implements Redux Toolkit thunks, reading packs, Study, sensor pointing, private notes and speech recognition. This is an AI planning revision, not a student-authored correction or implementation test. The student should review the PR, verify sources and decisions, and document any actual correction/verification with evidence. No runtime checks or builds were run for this documentation task.

## 2026-11-26 — v1.2.0 Offline Explorer (Expedition Packs & Offline Library Manager)

Antigravity implemented F01 (Expedition Packs) and F02 (Offline Library Manager) across `src/features/expeditions/`, `src/features/storage/`, `app/reading-packs.tsx`, and `app/offline-library.tsx`. Three genuine technical corrections arose during development:

| Date | Tool | Initial output | Student correction | Why it was changed | Evidence |
|---|---|---|---|---|---|
| 2026-11-26 | Antigravity | Used standard `z.string().url()` for source reference URLs | Added `.refine(u => /^https:\/\//.test(u))` to strictly enforce HTTPS | Zod standard url validator allows `javascript:` or `http:` schemes; project constraints require HTTPS for all external science and source links | `src/features/expeditions/manifest.ts`, `tests/expeditionManifest.test.ts` |
| 2026-11-26 | Antigravity | Wrapped `reconcileSavedImages()` inside `writeDatabase(async db => ...)` in `clearEligibleCache` | Removed nested `writeDatabase` wrapper and called `reconcileSavedImages` directly | `writeDatabase` serializes all transactions onto a single Promise chain (`writeQueue`). Calling `writeDatabase` inside another `writeDatabase` operation causes a fatal Promise queue deadlock | `src/features/storage/offlineStorageProjection.ts`, `tests/offlineStorageProjection.test.ts` |
| 2026-11-26 | Antigravity | Synchronous state reload call inside `useEffect` in `app/reading-packs.tsx` | Deferred state update via timer cleanup pattern (`setTimeout(..., 0)`) | React 19 / ESLint `react-hooks/set-state-in-effect` flags synchronous setState inside effects as causing cascading render penalties | `app/reading-packs.tsx` |
| 2026-11-26 | Antigravity | Queried non-existent table `schema_migrations` in migration verification test | Replaced with standard SQLite `PRAGMA user_version` query | COSMOLOG's SQLite architecture uses SQLite's built-in `PRAGMA user_version` register rather than a separate `schema_migrations` table | `tests/hardeningRegression.test.ts` |
| 2026-11-26 | Antigravity | Conflated SQLite text size from `study_packs` with physical media bytes | Separated `physicalMediaBytes` from `installedStudyTextBytes` across projection and UI | `study_packs` stores JSON text in SQLite; conflating database text records with binary media files on disk misleads users about reclaimable disk space | `src/features/storage/offlineStorageProjection.ts`, `app/offline-library.tsx` |

## 2026-11-26 — v1.2.0 Migration & Media Safety Blocker Correction

Antigravity resolved four release-blocker findings: migration 16 safety across both clean and modified v15 databases, service-level exclusive media lock coordinator, accurate physical disk accounting with active-owner exclusion, and decoupling learning progress from download removal. Three concrete technical corrections arose during this pass:

| Date | Tool | Initial output | Student correction | Why it was changed | Evidence |
|---|---|---|---|---|---|
| 2026-11-26 | Antigravity | Maximum database version check threw `Unsupported database version` on version 16 | Updated check from `version > 15` to `version > 16` in `src/database/db.ts` | Introducing migration 16 advances `PRAGMA user_version` to 16; leaving the upper bound check at 15 caused subsequent database opens and app restarts to reject the database | `src/database/db.ts`, `tests/migrationSafety.test.ts` |
| 2026-11-26 | Antigravity | Concurrency lock test checked `opStarted` immediately without microtask tick | Added `await new Promise(r => setTimeout(r, 0))` microtask yield | In promise-queue based lock mechanisms, `action()` executes in the next microtask turn after `previousLock` resolves; synchronously asserting execution flags without yielding causes false-negative test failures | `tests/mediaCoordinator.test.ts` |
| 2026-11-26 | Antigravity | Attributed physical bytes to unowned cache items whose files are shared with active favourites | Assigned `0` bytes and added dedicated `Recent discovery cache (file retained by active records)` reason | If an unowned cache row references a physical file also held by an active favourite or pack, the file cannot be pruned, so presenting it as reclaimable bytes misinforms the user | `src/features/storage/offlineStorageProjection.ts`, `tests/offlineStorageProjection.test.ts` |


