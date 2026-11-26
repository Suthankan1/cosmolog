# Release implementation index

This plan extends actual main (v1.1.1 baseline), not the original starter package. Keep all features on the roadmap. Do not check a box until the implementation and evidence exist. See PRODUCT_ROADMAP.md, docs/FEATURE_CATALOG.md, design/EXPANSION_ARCHITECTURE.md, design/EXPANSION_DATA_CONTRACTS.md and docs/RELEASE_STRATEGY.md.

| Order | Release task | Feature scope |
|---|---|---|
| 0 | [Baseline regression](00-baseline-regression.md) | Verify published/current state and assignment |
| 1 | [v1.2.0 Offline Explorer](v1.2.0-offline-explorer.md) | F01 + F02 |
| 2 | [v1.3.0 Beyond Time and Scale](v1.3.0-time-and-scale.md) | F03 + F04 |
| 3 | [v1.4.0 Field Observer](v1.4.0-field-observer.md) | F05 + F06 |
| 4 | [v1.5.0 Science Behind Space](v1.5.0-science-and-culture.md) | F07 + F08 |
| 5 | [v1.6.0 Your Cosmic Journey](v1.6.0-cosmic-journey.md) | F09 + F10 |
| 6 | [v1.7.0 Accessible Exploration](v1.7.0-accessible-exploration.md) | F11 + F12 |
| 7 | [v2.0.0 Integration](v2.0.0-integration.md) | All features, final integrated release |

Each task is a release plan; every checkbox can be implemented in a separate small PR. Record actual test/build/device results, source reviews and commit/PR references in docs/PROGRESS.md. If a feature is already implemented in a newer HEAD, inspect and verify it, then update the task rather than build a duplicate. This planning PR does not change package version, runtime code or database.
