# COSMOLOG

COSMOLOG is an editorial space and science archive for IN3210 Assignment 2. Read NASA Astronomy Picture of the Day and Spaceflight News dispatches, save discoveries to the Field Shelf, and leave private notes for later. A previously verified account can reopen the archive in airplane mode.

**Assignment mapping** · Index 234202J · Space & Science (2) · Offline-first (0)

**Selected bonus** · Reanimated bookmark feedback on a confirmed save, with reduced-motion support

## Run locally

Use the Node version in [`.nvmrc`](.nvmrc), a JDK 21 installation and Android Studio with the SDK/NDK required by the checked-in Android project. For iOS, install a compatible full Xcode and its simulators.

```sh
nvm use
npm ci
npm run android
```

For iOS use `npm run ios`. No API key or `.env` is required. Tap **Use demo account** on the sign-in screen. Registration exercises the DummyJSON simulation and returns to sign-in. The public demo account signs in independently.

### Self-contained Android build

A Gradle release build embeds the JavaScript bundle and assets. For an installable build, supply the local keystore path and its credentials using `COSMOLOG_SIGNING_STORE`, `COSMOLOG_SIGNING_STORE_PASSWORD`, `COSMOLOG_SIGNING_KEY_ALIAS`, and `COSMOLOG_SIGNING_KEY_PASSWORD`. Keep signing secrets outside the repository. With the Android SDK and JDK configured, run:

```sh
cd android
./gradlew :app:assembleRelease
```

Use the existing debug key only for local QA. Avoid Metro when validating airplane-mode cold starts.

## Offline walkthrough

1. Sign in online and wait for the two sources to populate Discover.
2. Open a discovery and save it. Text and provenance are available immediately. For a licensed image, wait for **Image available offline** before relying on the file.
3. Add a note in Details. Open Favourites to find the record by its title, publisher, or note. Use the **With notes** and **Image downloaded** filters.
4. Force-stop the app, turn on airplane mode, then launch it. Open Discover and the saved discovery, including any downloaded image. Edit the note and reopen the record.
5. Restore connectivity. Discover refreshes automatically. Profile shows the last successful timestamp for each source.

A fresh install needs connectivity for the first sign-in. A returning user with a verified SecureStore session can read locally during a network or account service outage. A legacy token-only install needs one verification online. If earlier device bookmarks exist, the Shelf offers a one-time import to the current account.

### Smart Reading

Scroll into a story to save a reading position. **Continue Reading** on Discover reopens the most recent unfinished story at its saved paragraph. **Dismiss** clears the checkpoint. **Mark as read** also adds the story to the account's offline **Reading history** on the Field Shelf. Use **To read** to filter out completed favourites. Changing the source text starts the reader at the top; changing text size preserves the paragraph anchor.

**Search space materials** checks SQLite immediately. With an internet connection, enter at least two characters to search the Spaceflight News and NASA media archives. Device results appear first. Scroll or tap **Load more results** for more matches. Select **NASA Media** for images, video and audio. **Search the wider web** opens a topic search in your browser. The Field Shelf searches private notes.

### Voice-to-Text: Voice Search & Observation Dictation
- **Hands-Free Celestial Search:** Tap the vector Feather `mic` button in the Search Bar to speak queries (*"Jupiter"*, *"James Webb"*, *"SpaceX"*). Spoken words stream live into the search input with real-time SQLite filtering and astronomical term biasing.
- **Voice Field Notes:** When viewing a saved discovery in the reading room, open **Add a note** or **Edit note** and tap **Dictate observation**. Real-time speech transcribes directly into the private field note editor with multi-sentence concatenation, live character limits (`draft.length / 1000`), and durable SQLite persistence.
- **Offline On-Device Recognition:** Utilizes hardware-accelerated on-device speech engines on supported devices (Android 13+ / iOS 17+) via `expo-speech-recognition`, allowing astronomers to search and dictate notes in remote dark-sky locations with zero internet connection.

Space Dispatches load in pages of 15. Older pages stay on the device through refreshes and restarts. **Reopen search** restores the latest stored search for the selected edition. Saved NASA media records preserve their description, date, credit and source link. Open the original online for playback or the full-resolution asset.

[Online archive search](docs/screenshots/22-online-archive-search.png) · [Search after an offline restart](docs/screenshots/23-offline-archive-search.png)

**Browse by date** opens a NASA plate from SQLite or retrieves it online the first time it is needed. Opening an older plate does not change the latest feed snapshot.

Under **Study, sky and archives**, **On This Day** offers an earlier NASA plate from the same month and day. Discover checks the local archive first. If no match is stored, it offers an online lookup for the most recent eligible prior year.

On the Field Shelf, open **Shelf tools → Collections**, create a named collection, then tap **Choose discoveries** to group existing favourites. A discovery can belong to multiple collections. You can create, rename, edit, and browse collections offline. Deleting a collection keeps its favourites and field notes.

From Discover or Profile, open **Expedition packs** to embark on structured science expeditions such as **A Tour of Saturn** or **Apollo at the Moon**. Each expedition combines celestial plates, Space Study theory chapters, and observational fieldwork prompts.

### Expedition Packs & Offline Library Management
- **Curated Multi-Step Expeditions (F01):** Expeditions guide astronomers through structured science journeys. Each step is tagged by type (`CELESTIAL PLATE`, `SPACE STUDY`, `FIELD OBSERVATION`) and status (`REQUIRED` vs `OPTIONAL`). Sourced attributions link directly to verified NASA, Cassini-Huygens, and Space Study references.
- **Decoupled Learning Progress:** Downloading plates for offline reading does not automatically mark steps as learned or completed. Human observation checkboxes track authentic study progress independently in SQLite schema version 16 (`expedition_progress` with `revision`). Removing offline downloads frees storage while preserving completed learning checkmarks intact; a separate "Reset progress" action with confirmation is provided.
- **Resumption & Cancellation:** Downloads enforce storage preflight quotas, provide an explicit **Cancel download** button to safely abort in-flight transfers, and resume missing steps deterministically.
- **Offline Library Manager (F02):** Dedicated storage and ownership console (`/offline-library`) accessible from Profile and Field Shelf. Distinctly measures and labels:
  - **Physical Media on Disk:** Verified deduplicated binary image files stored in app documents storage.
  - **Space Study Curriculum:** Installed database text records from Space Study supplements (labeled as content size).
  - **Eligible to Clear:** Unowned discovery feed image binaries safe to reclaim (excluding any file referenced by retained items across accounts).
- **Exclusive Lock Coordination & Safe Cache Cleanup:** Tapping **Clean unowned cache** calculates an exact preview of reclaimable storage while protecting all user favourites, notes, and expedition downloads across all accounts. Pruning and downloads synchronize under a service-level exclusive lock coordinator (`withExclusiveMediaLock`) to eliminate race conditions. Exact deleted bytes and files are reported.

| Guided expedition | Preserved progress on remove | Offline storage telemetry | Clean reset confirmation |
| --- | --- | --- | --- |
| ![Guided expedition](docs/screenshots/41-expeditions-deeplink.png) | ![Preserved progress](docs/screenshots/45-download-removed-progress-preserved.png) | ![Offline library telemetry](docs/screenshots/37-upgrade-offline-library.png) | ![Reset confirmation](docs/screenshots/48-reset-progress-dialog.png) |

### Interactive Astronomical Laboratories (Explore Hub & Beyond)
- **Explore Hub (`/explore`):** Central offline scientific discovery surface accessible via **LightTrace & Labs** from Discover. Hosts interactive computational models adhering strictly to International Bureau of Weights and Measures (BIPM) SI base units and International Astronomical Union (IAU) constants.
- **LightTrace (F03):** Offline cosmic light-travel lookback time calculator (`/explore/lighttrace`). Demonstrates how the finite speed of light ($c = 299,792,458\text{ m/s}$, exact BIPM definition S01) creates an observable lookback time across space: from the Moon's 1.3-second echo to Andromeda's 2.5-million-year ancient starlight. Features a logarithmic cosmic distance track, measurement details table, flat-space vs high-redshift cosmic expansion disclosures, actionable external citations, and deep links to related Space Study chapters and Sky Viewer targets.
- **Cosmic Scale Laboratory (F04):** Offline planetary scale and travel simulator (`/explore/scale`). Features:
  - **Diameter Mode:** Proportional volumetric mean diameter comparisons against selectable celestial baselines (Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn) from NASA Planetary Fact Sheets (S05).
  - **Distance Mode:** Explores heliocentric semi-major axes (AU/km) and clearly separates variable geocentric distances (mean, closest approach, and superior conjunction).
  - **Travel Time Simulator:** Straight-line Euclidean duration simulator ($t = d/v$) with speed presets (Commercial Jet, Voyager 1, Parker Solar Probe, 0.1c) and custom velocity inputs with strict physical validation rejecting speeds $\ge c$. Discloses straight-line Euclidean assumptions vs curved Keplerian orbital mechanics.
  - **Interconnected Learning:** Deep links to Space Study curriculum chapters (`/study/[id]`), Expeditions (`/reading-packs`), and Sky Viewer targets (`/sky-viewer`).

### Behind the Discovery: Sourced Evidence Dossiers (F07)
- **Peer-Reviewed Scientific Dossiers (`/study/dossiers`):** Rigorous observational case studies authored from primary literature (NASA, ESA, STScI, Keck) evaluating real spacecraft and observatory detections.
- **Four Ruled Scientific Blocks:** Every dossier structures evidence into four distinct ruled editorial blocks:
  1. **Empirical Observation:** Measured flux dips, spectral absorption lines, and astrometric coordinates.
  2. **Method & Instrumentation:** Observational facility (JWST, Hubble, Keck, VLT), detector modes, and wavelength regimes.
  3. **Scientific Inference:** Supported physical conclusions (e.g. molecular detection, enclosed gravitational mass).
  4. **Uncertainty & Boundary Conditions:** Honest science disclaimers stating what the evidence does NOT establish (e.g., carbon dioxide detection is not evidence of biological life; distinguishing empirical spectroscopic data from illustrative artist concepts).
- **Curated Case Studies:**
  - **Webb WASP-39 b NIRSpec Transmission Spectroscopy:** Decisive 4.3 µm molecular $CO_2$ absorption peak in a gas giant atmosphere (NASA S07/S08).
  - **Hubble Europa Plume Candidates:** Far-ultraviolet auroral emissions and limb transit silhouettes disclaiming confirmed ocean connectivity (NASA S12).
  - **Keck & VLT Sagittarius A* Orbit Astrometry:** Two-decade relativistic orbit of star S2 enclosing $4.15 \times 10^6\,M_\odot$ (Keck/ESO S12).
- **Interconnected Knowledge Graph:** Deep-linked from Space Study chapters (`/study/[id]`), Explore Hub (`/explore`), and Sky Viewer target detail sheets (`/sky-viewer`).

### Cultural Astronomy: One Sky, Many Stories (F08)
- **Cross-Cultural Asterism Comparison (`/explore/cultures`):** Interactive comparative viewer analyzing how ancient cultures observed the exact same equatorial stars and saw radically different celestial structures.
- **Curated Equatorial Traditions:**
  - **Indigenous Arabic & Bedouin Sky Culture (*Al-Jawza'*, "The Central Queen"):** Pre-Islamic desert navigation and seasonal monsoon (*anwa'*) tradition documented by Abd al-Rahman al-Sufi and Paul Kunitzsch (S09, CC BY-SA 4.0).
  - **Chinese Traditional Astronomy (*Shen*, 参宿, "Three Stars / Imperial Commander"):** 21st lunar mansion of the Western White Tiger (西方白虎) documented in Han dynasty *Shiji* records and Sun Xiaochun & Jakob Kistemaker (1997) (S09, CC BY-SA 4.0).
- **Stable Astronomical Projection:** Mathematical 2D projection guaranteeing 100% stable, identical pixel coordinates for all 7 stars across traditions.
- **Accessibility & Integrity:** Non-gesture mode selector (Al-Jawza', Shen, Compare Both), screen-reader friendly Star Telemetry Table, and explicit disclosures distinguishing indigenous asterisms from modern IAU constellation boundaries.

### Sky Viewer

Open **Discover → Study, sky and archives → Sky Viewer** and tap **Use my location**. Hold the back of your phone toward the sky to orient the chart. To explore manually, drag the chart or use the arrow buttons. **Change location** accepts signed decimal coordinates and offers a Colombo preview. Tap a marker or choose an object in **Objects above the horizon** to read its details and follow its source links.

The bundled star and deep-sky catalogs, Moon and planet positions, and detail text work offline. The chart shows geometric positions. Your equipment, daylight, and observing conditions affect what you can see. When orbit data is available, the ISS and Hubble are shown as predictions. The viewer flags elements at 24 hours and hides predictions at 72 hours. Locations and motion readings stay in memory. [Catalog sources and licences](src/features/sky/catalog/README.md)

### Field Observer: Journal, Attachments & Celestial Field Instrument
- **Independent Field Observations (F05):** Dedicated observational notebook surface (`/fieldwork`) for astronomers, decoupled from article reading notes. Stores structured sightings with target name, observing timestamp, sky conditions (Clear, Partly Cloudy, Hazy, Light Pollution), observing equipment notes, and qualitative field observations. Account-isolated in durable SQLite (`observations` table, schema migrations 17-19).
- **Consent-Based Coordinates & Eyepiece Photos:** Optional GPS location capture rounded to ~11m precision (4 decimal places) with bounds validation ($-90^\circ$ to $+90^\circ$ lat, $-180^\circ$ to $+180^\circ$ lon), and photo attachment support (< 12 MB) stored safely in app-private `cosmolog_observations/` isolated from cache cleanup. Permissions requested strictly upon explicit user interaction; zero boot prompts or telemetry tracking.
- **Celestial Field Instrument (F06):** Precision horizontal field instrument (`/fieldwork/instrument`) deriving real-time Azimuth ($0^\circ\text{--}360^\circ$) and Elevation ($-90^\circ\text{--}+90^\circ$) with 16-point cardinal rose tracking. Features:
  - **Sensors & Manual Fallback:** Uses device gyroscope, accelerometer, and magnetometer in foreground only. Defensible heading reference explicitly distinguishes True North (when valid declination exists) from Magnetic North without fabrication. Manual stepping controls allow manual bearing entry.
  - **Solar Observing Safety:** Prominently warns observers against aiming instruments or optics toward the Sun without certified ISO 12312-2 solar filtration to prevent irreversible eye damage.
  - **Instrument Snapshots:** Attach validated orientation telemetry directly to observations with explicit source separation (`sensor` vs `manual`).
  - **Deep-Linked Target Sighting:** Seamlessly transition from Sky Viewer detail sheets (`/sky-viewer`) to the Field Instrument with target guidance offsets.

### Your Cosmic Journey: Personal Sky Timeline & Annual Meteor Calendar
- **Personal Sky Timeline (F09):** Unified SQLite read projection (`/timeline`) integrating observations, saved discoveries, article reading history, and study bookmarks into an account-isolated chronology. Local timezone engine (`Asia/Colombo` +05:30) organizes entries into Today, Yesterday, formatted months, and undated marks with zero data duplication.
- **Sourced Annual Meteor Calendar (F10):** Annual astronomical meteor shower calendar (`/events/meteors`) sourced from IMO and AMS for 2026. Computes exact local peak times, preserves date-only shower precision, features an idealized ZHR caveat, and deep-links directly to observation logging and Sky Viewer radiants.

### Accessible Exploration: Read Aloud & Night Observation Mode
- **Accessible Read Aloud (F11):** Native speech synthesis (`expo-speech`) with sentence-bounded chunking (<350 chars), rate controls ($0.8\times\text{--}1.5\times$), stale callback cancellation, and mutual exclusion with speech recognition. Offers audio guidance for iOS physical silent switch boundaries and publisher summaries.
- **Night Observation Mode (F12):** Contrast-tested dark red and charcoal semantic theme (`#0D0B0B` background, `#1A1414` surface, `#E64A38` red accent, `#F2D6D3` high-contrast ink) designed to protect rhodopsin and night adaptation at the telescope eyepiece (>13:1 body contrast, >4.8:1 heading contrast). Persisted safely per account in SQLite (`reader_preferences`, migration 20) with quick toggle chips in Fieldwork Hub and Profile.

### Media and provenance

NASA APOD and Spaceflight News retain the original publication link, available credits, and source date. **Share discovery** opens the device share sheet with the public title, credit, and link. The sheet can open from cached Details while offline. News records contain publisher summaries. APOD video and iframe records link to the source. The app stores images durably when a recognized Creative Commons license or documented NASA-only credit permits it. Other records retain text and provenance. Each saved entry reports its actual image state. The sign-in masthead uses NASA’s Earthrise photograph, AS08-14-2383, credited to NASA / Bill Anders.

- [NASA APOD API](https://api.nasa.gov/assets/files/apod/APOD-APIs-and-RSS-info.pdf)
- [Spaceflight News API v4](https://api.spaceflightnewsapi.net/v4/docs/)
- [DummyJSON authentication](https://dummyjson.com/docs/auth)
- [NASA Earthrise](https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/)
- [Jupiter image credits](https://science.nasa.gov/wp-json/wp/v2/apod-basic/261122) · NASA/Juno/SwRI/MSSS, processing by Matt Brealey and Seán Doran · [CC BY-NC 3.0](https://creativecommons.org/licenses/by-nc/3.0/)
- [Cocoon Nebula Wide Field](https://apod.nasa.gov/apod/ap140918.html) · Federico Pelliccia

## Magazine edition

COSMOLOG opens with a one-second reveal of the Apollo 17 globe and ivory masthead. Skip is available immediately. Reduce Motion goes directly to session handoff. The source selector stays above the cover as readers switch between All sources, Daily Plates and Dispatches. A missing network connection preserves access to the local archive.

The centred three-tab dock targets 264 points at standard type size and expands for larger labels. Supported iPhones use native glass, with an opaque Reduce Transparency fallback. Android uses an elevated ivory surface.

| All sources | Daily Plates | Dispatches |
| --- | --- | --- |
| ![All sources cover](docs/screenshots/magazine/all-sources.png) | ![NASA edition](docs/screenshots/magazine/daily-plates.png) | ![Dispatch edition](docs/screenshots/magazine/dispatches.png) |

| Sign in | Article | Field Shelf | Cold launch offline |
| --- | --- | --- | --- |
| ![Sign in](docs/screenshots/magazine/login.png) | ![Article details](docs/screenshots/magazine/details.png) | ![Field Shelf](docs/screenshots/magazine/shelf.png) | ![Offline archive](docs/screenshots/magazine/offline.png) |

[Magazine identity and launch storyboard](design/magazine/identity-and-motion.svg) · [Editable edition layouts](design/magazine/editions.svg) · [Magazine screen handoff](design/magazine/screens.svg)

## Earlier release screenshots

| Sign in | Discover | Details |
| --- | --- | --- |
| ![Sign in](docs/screenshots/01-login.png) | ![Discover](docs/screenshots/02-discover.png) | ![Details](docs/screenshots/03-details.png) |

| Field Shelf | Cold launch offline | Offline field note |
| --- | --- | --- |
| ![Field Shelf](docs/screenshots/04-shelf.png) | ![Offline Discover](docs/screenshots/05-offline-banner.png) | ![Offline Field Journal](docs/screenshots/06-journal-offline.png) |

| Plate opened by date | Continue Reading | Offline archive search |
| --- | --- | --- |
| ![Cocoon Nebula Wide Field](docs/screenshots/07-browse-by-date.png) | ![Continue Reading card](docs/screenshots/08-continue-reading.png) | ![Offline search results](docs/screenshots/09-offline-search.png) |

| Field Shelf collection in airplane mode | Reading pack in airplane mode |
| --- | --- |
| ![Offline Saturn study collection](docs/screenshots/11-offline-collection.png) | ![The Saturn reading pack with three downloaded plates and one available image](docs/screenshots/12-offline-reading-packs.png) |

| Sky Viewer in airplane mode | Whirlpool Galaxy details in airplane mode |
| --- | --- |
| ![Offline Colombo sky chart](docs/screenshots/13-sky-viewer-offline.png) | ![Offline Whirlpool Galaxy detail sheet](docs/screenshots/14-sky-object-offline.png) |

## Architecture and state

Expo Router protects the main stack and passes a source and ID to Details. A Redux Toolkit coordinator loads SQLite before starting remote refresh. It shares connection, request, and save state across the screens. Validated and normalized source responses become SQLite transactions. Each transaction updates a source snapshot and its last successful timestamp together.

Sky Viewer calculates celestial positions and device pointing locally. It uses the same Redux Toolkit thunk pattern for CelesTrak requests and stores the last validated orbital elements in SQLite. Viewer focus and connection state control requests, and the database enforces a two-hour minimum between attempts.

```mermaid
flowchart LR
  Screens[Expo Router screens] --> State[Redux Toolkit thunks]
  State --> Sources[NASA APOD and Spaceflight News]
  State --> Session[DummyJSON and SecureStore]
  Sources --> Repositories[SQLite repositories]
  State --> Repositories
  Repositories --> SQLite[(Snapshots, favourites, notes, reading checkpoints)]
  State --> Files[Durable image files]
```

See [Architecture](design/ARCHITECTURE.md), [Data model](design/DATA_MODEL.md), and [Decision records](docs/DECISIONS.md).

### Key decisions

1. **Restore the verified session locally.** A network profile check made an offline restart look like a logout. SecureStore now holds the verified identity and tokens. Online validation can refresh or revoke them while the archive remains available during a temporary service failure.
2. **Use SQLite and one sync coordinator.** Cached items, source membership, and refresh metadata are durable together. Redux Toolkit thunks were retained so the app has one place that controls request ordering and reconciles results with SQLite. The trade-off is that the coordinator owns deduplication and retry behavior.
3. **Separate bookmarking from downloading.** A file server can be slow or down, so the bookmark is committed first. Image status becomes ready only after the validated local file exists. The journal has useful text and notes even when the image is unavailable.
4. **Keep online search separate from the feed.** Search records share the SQLite item table. Ordered search results belong to the account and edition. Looking up Europa never replaces the Daily Plate or advances the feed timestamp. NASA media search runs directly against its public catalogue. The wider-web action requires no hosted proxy or search API key. [NASA media API](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf)
5. **Own bookmarks and notes by account.** Feed records are public, so the database can reuse them across accounts. The SQLite favourite relationship carries ownership and the field note. A legacy bookmark has no owner until a signed-in person imports it.

## Verification

```sh
npm run lint
npm run typecheck
npm test -- --runInBand
```

Jest exercises auth lifecycle, real SQLite migrations and rollback through Node's SQLite driver (including migration 16 supporting v14, unmodified v15, and modified v15 upgrade paths, up to migration 20 reader preferences), reconnect and source failure behavior, route validation, media normalization, checkpoints, archive search, media lock mutual exclusion, expedition manifest boundary validation, celestial mechanics, and voice synthesis. 66 test suites and 381 automated tests pass 100% cleanly. A GitHub Actions workflow repeats the JavaScript checks on a clean install. The v2.0.0 Android run verified upgrade without data loss, paragraph restore, local search after an airplane-mode cold launch, expedition download cancellation and resumption, and cache pruning with genuine disk telemetry. See [device scenarios and evidence](docs/TEST_PLAN.md), the [demo script](docs/DEMO_SCRIPT.md), and [AI usage](AI_USAGE.md).

## Space Study

Open **Discover → Study, sky and archives → Space Study** for eight original introductory chapters and the object atlas. Try **M31**, **25544**, **Titan** or **Starlink**. Chapters include definitions, examples and source links. Save a section to the Field Shelf, add a private field note or reopen the last chapter with **Continue reading**. The bundled guide and the Earthrise figure are available after an offline restart with a restored session.

**My sky → Change location** searches 52,004 places offline. Pick a city to use its coordinates and civil time zone. Selecting another location or the Colombo preview replaces the remembered city. Geometric altitude tells you where a target lies relative to the horizon. Weather and daylight still affect observation. The first edition includes STARLINK-1008 and STARLINK-1012 alongside ISS and Hubble. [GeoNames attribution](assets/study/README.md) · [CelesTrak Starlink catalog](https://celestrak.org/NORAD/elements/table.php?GROUP=starlink)

**Editions and downloads** includes an installable observatories supplement. New editions use versioned JSON parts and the manifest in study-releases. The app checks the project's public main-branch manifest when Downloads is active and online, at most once daily. Each part has an expected byte length, checksum and record count. SQLite activates the new edition after validation. Bookmarked entries survive removal. Publishing a new remote edition requires publishing the corresponding repository assets. The bundled first edition works independently.

The archive migration preserves existing discoveries, favourites and orbital data. Study routes carry a stable ID. Reader checkpoints and notes belong to the signed-in account. City lookup uses a separate bundled SQLite index so opening Discover does not import place records.

| Android guide | Offline chapter bookmark | Kandy sky in airplane mode | iOS reader |
| --- | --- | --- | --- |
| ![Bundled Space Study guide](docs/screenshots/15-space-study.png) | ![Restored Saturn section](docs/screenshots/16-study-offline-section.png) | ![Offline sky for Kandy](docs/screenshots/17-study-kandy-offline.png) | ![Native iOS Saturn chapter](docs/screenshots/18-ios-field-guide.png) |

The first-edition city index occupies 11,960,320 bytes uncompressed and 5,279,873 bytes inside the Android APK. A Pixel 9 emulator timing harness ran 60 local searches against the installed SQLite edition using Hermes, including layout of the first result page. The 95th percentile was **22.8 ms**. Physical-device timing can differ. Before a content release, run `npm test -- --runInBand tests/studyEdition.test.ts tests/studyDownloads.test.ts` to validate the book and pack manifests.

## Shipped 12-Capability Platform (COSMOLOG v2.0.0)

All twelve planned Space & Science discovery and field exploration capabilities (F01–F12) are fully implemented, verified, tested, and shipped in COSMOLOG v2.0.0. See the [product roadmap](PRODUCT_ROADMAP.md), [feature catalogue](docs/FEATURE_CATALOG.md), [expansion architecture](design/EXPANSION_ARCHITECTURE.md), [source registry](docs/expansion/SOURCE_REGISTRY.md), [release tasks](tasks/releases/README.md) and [implementation prompt](MASTER_IMPLEMENTATION_PROMPT.md). All twelve expansions are delivered with verified automated test coverage (381 tests across 66 suites).

Development progress and completed issues are tracked in [GitHub issue #31 — agent task queue](https://github.com/Suthankan1/cosmolog/issues/31).
