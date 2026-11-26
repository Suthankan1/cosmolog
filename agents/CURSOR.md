---
description: COSMOLOG project-wide rules
alwaysApply: true
---
Read and follow `AGENTS.md` and `PROJECT_CONTEXT.md`. The assignment requires Space & Science + offline-first for index 234202J. Use Expo + React Native + TypeScript, Expo Router, Redux Toolkit, SQLite for durable offline content/favourites, SecureStore for tokens, NetInfo for connectivity and Feather icons. Details routes receive item IDs, not full objects. Local data must render before network refresh. Do not claim stale data is live. Use the editorial warm palette and typography in `design/DESIGN_SYSTEM.md`. Add tests and update `docs/PROGRESS.md` for each slice. Do not implement optional features before the required offline journey works.

For cumulative release work, read root `MASTER_IMPLEMENTATION_PROMPT.md`, `PRODUCT_ROADMAP.md`, `docs/FEATURE_CATALOG.md`, `docs/RELEASE_STRATEGY.md`, `docs/expansion/SOURCE_REGISTRY.md` and the applicable `tasks/releases/` task. Preserve the actual v1.1.1 baseline and magazine design; use existing thunks and SQLite rather than duplicating features. Begin with the baseline gate and one small tested slice. Do not mark planned features or release tags as complete until verified.
