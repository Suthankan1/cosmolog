# AI usage record

This file must be updated honestly throughout development.

## Tools used
- ChatGPT: product concept, assignment interpretation, initial architecture and project documentation.
- Figma integration: authored COSMOLOG brand identity, editable mark, token collection, typography styles, component references, screen wireframes and system-state board.
- Other coding agents (Claude, Codex, Antigravity, Copilot, Cursor): add exact tool/version, date, task and files changed when actually used.

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
