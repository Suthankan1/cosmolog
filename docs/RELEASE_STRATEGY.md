# Release strategy and verification gates

All twelve features are approved scope, but all increments remain planned until merged, tested and released. Target release numbers are forward-only from the actual published v1.1.1. No historical tags are changed by this docs PR. v2.0.0 is an integrated product milestone; do not manufacture a breaking API merely to justify it. Confirm version naming at release time.

## Git process
1. Start from current main, read AGENTS and the release task. Check worktree, latest commit, package version and open PRs.
2. Create a feature branch per small slice (e.g. feat/expedition-progress); implement focused tests, run checks, commit descriptively. Do not make unrelated changes or regenerate the Android project indiscriminately.
3. Open PR to main with feature ID, acceptance checklist, source/license evidence, migration notes, screenshots/video if UI, and exact checks/results. Merge only after review; don't bypass protected checks. Each release can aggregate several merged small PRs.
4. When all release gates pass, bump app/package/native versions consistently with existing release workflow, update changelog and README/PROGRESS/AI_USAGE truthfully, tag vX.Y.Z and publish using existing .github/workflows/package-release.yml after inspecting its inputs/signing policy. Do not expose signing secrets. This roadmap PR does none of these runtime actions.

## Every release gate
- Existing assignment journey remains green: online DummyJSON sign-in, simulated register, name, details by source/id, save/remove list and details, real data, loading/error/empty, restart in airplane mode, offline indicator and auto reconnect refresh; first install offline explained, verified returning session.
- Run npm ci (clean install), npm run lint, npm run typecheck, npm test -- --runInBand and relevant native build. Run current workflow (.github/workflows/verify.yml) via PR and inspect result. Do not assert passing until observed.
- Self-contained Android build/device or emulator without Metro for offline cold start; real iOS device/simulator if available. Report skipped checks and platform limitations. Native module permission changes require native rebuild.
- Test fresh DB and upgrade from previously published DB, transaction rollback, two accounts, sign-out during work, corruption/missing file/low storage, offline interruption/retry and no loss of existing bookmarks, notes, packs or checkpoints.
- Accessibility: Feather icons, minimum touch target 48 dp Android/44 pt iOS, safe areas, dynamic text 200% where supported, contrast, VoiceOver/TalkBack focus/labels, reduced motion, no color-only state. Review 320/360/390/430 widths and keyboard.
- Science: valid units, precision/uncertainty, source dates, rights and attribution; check data with independent authoritative references. Reject invented scientific/cultural content; no NASA branding misuse. Validate annual calendar and remote pack format.
- Security: OS secure token only, TLS validation, parameterized queries, allowlisted content origins, bounded data/files, app-private photos, permission minimization, no tokens/signing keys/private notes/photos in logs or public repo; no background sensing.
- Performance: measure cold cache render, list scroll, search and package size against v1.1.1 on same hardware; define budget before change, record reproducible results. No unbounded downloads, memory copies or duplicated files. Only focused watchers.
- Docs: real screenshots, changes/known limitations, source registry, ADRs, tests/verification evidence, truthful AI correction; student can explain decisions. No placeholder charts masquerading as science.
- Definition of done: all required release-specific criteria satisfied, review complete, tests green, no critical security/data-loss defect, stable signed build where appropriate. If a gate fails, ship fewer features or delay the version. Never call a partially completed target fully released.

## Assignment cutoff

13 December 2026, 23:59 local course time. Freeze optional work by Dec 9 unless all mandatory checks already pass and there is time for regression QA. Submit the latest verified stable build, not necessarily v2.0.0. Preserve the original three-minute assessment demonstration: ~1 minute login/list/details/save/restart/offline/reconnect and ~2 minutes explaining actual implementation/code. Show one signature extension only if time remains. Existing Reanimated bonus remains selected; do not claim multiple +5 bonuses. Post-submission releases may continue at a sustainable pace.
