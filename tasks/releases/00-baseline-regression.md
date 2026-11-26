# 00 — Baseline regression (before any expansion)

Baseline recorded at main 971df1033ac3349edbfa95d8debc93700e893646, package 1.1.1. README and progress log report functioning archive, Sky Viewer, Space Study and voice recognition; rerun checks to verify current HEAD. Preserve all existing app state and design. Do not install packages or change schema just to run this gate.

- [x] Record current main SHA, package/native versions, latest GitHub release, installed Node/SDK, git status. Inspect existing PRs before branching.
- [x] Clean dependency install with repository Node version and npm ci; run npm run lint, npm run typecheck, npm test -- --runInBand. Record exact outputs; investigate failures independently.
- [x] Verify baseline tests especially authSlice, feedSync, sqliteRepositories, navigationParams, readingPacks, studyDownloads, mediaPolicy, skyPointing, skyViewer, floatingTabs, voiceToText and FieldNoteVoice.
- [x] Verify self-contained Android app on emulator/device (not Metro) with online sign-in, real NASA and dispatches, save from list/detail, note, reading pack, force-stop, airplane-mode restart, cached feed and favourites, then automatic reconnect. Test simulated registration and logout; verify account isolation and permission denial.
- [x] Verify existing reading packs, Space Study editions and licensed media retention; no image falsely reported ready. Inspect package-release workflow and current app native version policy; do not publish now.
- [x] Check existing accessible UI, no clipped text, dynamic fonts/keyboard, reduced motion and clear offline/no-cache state. Record source/API limitations and current defects.
- [x] Confirm 13 Dec deadline and leave Dec 9–12 stabilization buffer. Fix compulsory defects first in separate branches; proceed to F01 only when baseline acceptable.

Evidence: append actual results and device/platform limitations to docs/PROGRESS.md. Do not mark this gate complete merely because previous commits reported 128 tests.
