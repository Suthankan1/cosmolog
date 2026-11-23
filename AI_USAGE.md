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
