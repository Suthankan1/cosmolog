# Research and source registry — expansion planning

Reviewed for planning on 2026-11-26. Sources are links for implementation and content review; API live responses, asset licenses and package compatibility must still be checked before shipping. Do not copy third-party text, images, cultural data or full calendars without permission. This PR includes original planning/specification text and a tiny candidate factual seed dataset, not imported copyrighted media or private course PDFs.

## Project sources

- Current main commit: https://github.com/Suthankan1/cosmolog/tree/971df1033ac3349edbfa95d8debc93700e893646
- README, package.json, src/database/schema.ts and db.ts, design/ARCHITECTURE.md, docs/DECISIONS.md, design/magazine/, docs/PROGRESS.md, src/features/discovery/readingPacks.ts, src/features/study/packDownloads.ts, src/features/journal/FieldNote.tsx, src/features/sky/catalog/README.md, src/features/sky/useSkyPointing.ts, src/services/voice/speechService.ts.
- Assignment requirements: docs/ASSIGNMENT_REQUIREMENTS.md; original lecturer handout and six lecture notes are the authoritative private course materials. Keep the original PDFs in the student's private local project sources if redistribution permission is unknown. Do not publish them or the uploaded Deep Research report in this branch.
- Research inspiration: user's uploaded COSMOLOG research report (cosmolog.md) and approved twelve-feature conversation roadmap. Its repo audit had no access; this branch replaces its assumptions with the actual code baseline. The numerical originality ratings were subjective, not empirical.

## Primary science/data references

| ID | Source | Use / gate |
|---|---|---|
| S01 | [BIPM definition of metre](https://www.bipm.org/en/si-base-units/metre) | Exact c = 299792458 m/s; F03/F04 |
| S02 | [NASA Cosmic Distances](https://science.nasa.gov/solar-system/cosmic-distances/) | Local light time, distance vs time, approximations; F03 |
| S03 | [NASA Basics of Space Flight, ch. 1](https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/) | Approximate lunar distance, light-time context; F03/F04 |
| S04 | [NASA Sun facts](https://science.nasa.gov/sun/facts/) | Mean Sun distance and Proxima Centauri example; F03 |
| S05 | [NASA planet sizes and locations](https://science.nasa.gov/solar-system/planets/planet-sizes-and-locations-in-our-solar-system/) | Radii/diameter conventions, average orbital distance; F04; verify each value |
| S06 | [NASA Hubble M31](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/) | Approximate Andromeda example and related study link; F03 |
| S07 | [Webb WASP-39 b spectrum](https://science.nasa.gov/asset/webb/exoplanet-wasp-39-b-nirspec-transmission-spectrum/) | First dossier: observation, NIRSpec, CO2 evidence; F07, image rights separately |
| S08 | [Webb exoplanet research](https://science.nasa.gov/mission/webb/science-overview/science-explainers/webbs-impact-on-exoplanet-research/) | Source context and further evidence; F07 |
| S09 | [Stellarium sky cultures](https://stellarium.org/en_US/skycultures.html), [format and dataset repository](https://github.com/Stellarium/stellarium-skycultures) | F08 precedent and format; each culture has distinct text/line/art licenses; select verified subset after review, pin revision |
| S10 | [International Meteor Organization calendar](https://www.imo.net/calendar/) | F10 annual active/peak dates; cite edition, verify rights and date precision |
| S11 | [American Meteor Society calendar](https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/) | F10 cross-check, not independent local visibility forecast |
| S12 | [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) | F01/F07 media permissions; third-party credits/marks and rights exceptions |
| S13 | [HYG Database](https://github.com/astronexus/HYG-Database), [OpenNGC](https://github.com/mattiaverga/OpenNGC) | Existing catalog extracts and source acknowledgements; follow src/features/sky/catalog/README.md and CC BY-SA 4.0; do not silently relicense |
| S14 | [CelesTrak](https://celestrak.org/) | Existing orbital data only; keep freshness gates |
| S15 | [NASA Open APIs](https://api.nasa.gov/index.html), [NASA Science APOD basic route](https://science.nasa.gov/wp-json/wp/v2/apod-basic/), [Spaceflight News v4](https://api.spaceflightnewsapi.net/v4/docs/), [DummyJSON auth](https://dummyjson.com/docs/auth) | Existing adapters; verify current schemas before changing, never assume old APOD API permanence or full article availability |
| S16 | [NASA Skywatching](https://science.nasa.gov/skywatching/) | General observing and solar safety; F06/F10; no local visibility guarantees |
| S17 | [Astronomy Engine](https://github.com/cosinekitty/astronomy) | Already installed; geometry/ephemeris, pin version and confirm coordinate frames |
| S18 | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility reference; apply relevant criteria to native UI alongside course target sizes; no universal legal claim |

## Platform sources (verify against installed SDK)

- [Expo SDK reference](https://docs.expo.dev/versions/latest/) — use project SDK and lockfile; no automatic upgrades.
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) and [FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/) — local persistence and app-private files; DB/filesystem aren't one atomic transaction.
- [Expo Sensors](https://docs.expo.dev/versions/latest/sdk/sensors/) and [Location](https://docs.expo.dev/versions/latest/sdk/location/) — F06; device availability and foreground lifecycle.
- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) — F05; system picker/camera; review Android permission defaults, do not add redundant audio permission.
- [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/) — F11; synthesis, OS voice limits, iOS silent mode caveat; test device offline rather than assuming.
- [Expo Router protected routes](https://docs.expo.dev/router/advanced/protected/) — navigation and guarded deep links.
- [Redux Toolkit createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk) — existing coordinator pattern and cancellation.
- [React Native accessibility](https://reactnative.dev/docs/accessibility) — accessible controls and alternatives for diagrams.

## Content intake gate

For each data record retain source ID + actual URL, title/publisher, version/date of access, relevant units/reference frame/precision, author/credit, license/permission and transformation notes. Facts and constants are not a blanket license for source prose/media. Link to originals; author concise original explanatory text. Use trusted origin and pinned checksum for downloaded data; check upstream terms. A scientific reviewer/student checks claims and citations before publication. Culture content needs actual documented tradition, individual licenses and representation review; no fabricated mythology. Meteor records need checked annual edition and current year label; don't copy whole calendars. Night mode is intended to reduce disruptive light, not medically guaranteed to preserve dark adaptation. Store only reviewed facts in production; the small seed JSON is a candidate starting point.
