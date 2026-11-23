# Progress log

## 2026-11-22 — Design foundation / project handoff
Completed:
- Interpreted assignment index 234202J: Space & Science + Offline-first.
- Created Figma file in Suthankan Balenthiran's team.
- Created brand mark and wordmark direction, local design tokens and typography styles.
- Authored editable brand board, component reference board, five screen frames and state/flow board.
- Prepared multi-agent project documentation and source-material package.

Not completed:
- React Native application has not been scaffolded.
- No API integration, auth, SQLite, offline sync or tests have been implemented.
- Figma visual boards require student review and any final visual refinements before coding.

Next:
1. Open Figma and review layout/brand/screens.
2. Confirm the chosen NASA endpoint response and Spaceflight News API.
3. Initialize current stable Expo SDK project.
4. Start task `tasks/00-foundation-and-repo.md`.

## 2026-11-22 — COSMOLOG v2 complete editorial Figma redesign

The student rejected the original v1 visual work. V1 is preserved in archived Figma pages and is not a valid implementation target.

**Completed in Figma:** v2 cover, brand board, app icon, vector logo, Playfair/Inter styles, semantic colour tokens, 21 Feather-style icon components, button/input/chip/offline banner and three navigation variants, seven 390×844 primary screens, five 390×844 failure/offline/empty UX-state screens, navigation/data-flow board, and a three-phase launch-motion storyboard. Main screens were rendered and visually inspected; two overlapping text groups in offline/error states were corrected, then rechecked.

**Images:** Five illustrative Figma AI generations (Saturn, Mars, nebula, Moon, moon horizon) used in mockups. They are not real NASA photos, are not guaranteed for shipping, and must be replaced by attributed live API images in the actual app.

**Project files:** New SVG/PNG mark and app icon; v2 tokens/design specs; original generated visual references bundled; the AI-agent handoff and ZIP re-synchronized.

**Not completed:** React Native app functionality, API adapters, SQLite, DummyJSON login, runtime animation, actual test coverage. The Figma design is an editable mockup, not functioning mobile software. Final device accessibility/usability checks and responsive font scaling remain implementation tasks.

## 2026-11-22 — Task 00: Foundation, Project Configuration, and Route Skeleton Complete
Completed:
- Verified Expo SDK 58 runtime environment with React 19.3.1 and React Native 0.88.1.
- Initialized project configuration (`package.json`, `app.json`, `tsconfig.json`).
- Configured TypeScript with strict mode, Jest types, and `@/*` module aliases.
- Configured ESLint 9 using native flat config with `eslint-config-expo/flat.js`.
- Implemented Figma v2 editorial design tokens (`colors`, `spacing`, `radii`, `typography`, `layout`) in `src/theme/tokens.ts`.
- Implemented Feather icon wrapper `src/components/common/Icon.tsx` with full accessible prop forwarding.
- Configured Jest and `jest-expo` with custom Reanimated mock.
- Created route skeleton:
  - `app/_layout.tsx` (Google fonts loading for Playfair Display and Inter, splash screen coordination, Stack container).
  - `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`.
  - `app/(tabs)/_layout.tsx` (Discover, The Field Shelf, Field Log & Profile with Feather icons and editorial styling).
  - `app/(tabs)/index.tsx`, `app/(tabs)/favourites.tsx`, `app/(tabs)/profile.tsx`.
  - `app/details/[source]/[id].tsx` (typed route parameters).
- Verified Android bundle compilation via `npx expo export --platform android` (1,194 modules bundled cleanly).
- Automated test suites passing (5 unit and component tests).
## 2026-11-22 — Task 06: Verification, Genuine Screenshots, Documentation & Demo Script Complete
Completed:
- Verified native Android prebuild and compilation:
  - Cleaned and generated native Android project via `npx expo prebuild --platform android --clean`.
  - Assembled native Android debug APK via Gradle 9.4.1 + OpenJDK 21 (`android/app/build/outputs/apk/debug/app-debug.apk`).
  - Booted Android emulator `Pixel_9` (Android 15 / API 35) and installed `app-debug.apk`.
  - Connected app to Metro dev server bundling 1,895 modules.
- Executed and validated real end-to-end device workflow:
  - Successfully logged in using DummyJSON credentials (`emilys` / `emilyspass`).
  - Fetched live NASA APOD replacement endpoint (`https://science.nasa.gov/wp-json/wp/v2/apod-basic/`) and Spaceflight News API v4.
  - Tapped Daily Plate card to open typed reading room (`/details/nasa-apod/current`).
  - Preserved discovery to The Field Shelf via animated Reanimated bookmark button.
  - Verified local image caching via `expo-file-system/legacy` into persistent app documents directory.
  - Navigated to The Field Shelf tab and confirmed preserved discovery card count and content.
  - Simulated network failure via `adb shell svc wifi disable && adb shell svc data disable`.
  - Confirmed Sage offline banner rendered with truthful SQLite synchronization timestamp and manual retry button.
  - Restored network connectivity via `adb shell svc wifi enable && adb shell svc data enable`.
- Captured genuine on-device screenshots in `docs/screenshots/`:
  - `01-login.png`: Editorial Login screen with autofill helper.
  - `02-discover.png`: Discover feed with Daily Plate hero card and dispatches.
  - `03-details.png`: Celestial observation reading room with live Juno Jupiter imagery and provenance table.
  - `04-shelf.png`: The Field Shelf with preserved offline card.
  - `05-offline-banner.png`: Offline Field Mode banner with exact sync timestamp.
- Authored comprehensive documentation deliverables:
  - `docs/DEMO_SCRIPT.md`: Precise 3-minute video presentation script (1 min user flow, 2 min code walkthrough).
  - `README.md`: System architecture diagram, offline storage choice, 3 key architectural decisions (ADR-003 SecureStore isolation, ADR-002 SQLite hydration, ADR-007 route decoupling), setup commands, test results, and screenshots gallery.
  - `AI_USAGE.md`: Documented 4 genuine technical corrections with rationale and file references.
- All 13 test suites (47 tests), ESLint 9, and TypeScript checks pass cleanly.

## 2026-11-22 — Task 05: UI Polish, Real-Time Search, Accessibility & Selected Bonus Complete
Completed:
- Implemented real-time local search in `src/components/discovery/SearchBar.tsx`:
  - Instant filtering across titles, summaries, and authors.
  - Clear button affordance and dedicated zero-matches empty state.
- Enhanced accessibility across all components:
  - Ensured minimum touch target >=48 dp (`layout.minimumTouchTarget = 48`) on all buttons, inputs, icons, and list rows.
  - Verified WCAG AA contrast ratios across editorial palette (Ivory `#F8F4EA`, Forest `#184235`, Ink `#2C2A27`, Sage Light `#E3E9DC`).
  - Added semantic `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` props.
  - Supported dynamic font scaling and reduced motion (`AccessibilityInfo.isReduceMotionEnabled`).
- Completed selected assignment bonus:
  - Built Reanimated bookmark/save spring micro-interaction in `src/components/common/FavouriteButton.tsx`.
- Enhanced Profile screen:
  - Real-time on-device storage telemetry (live count of SQLite cached items and Field Shelf favourites).
  - Truthful formatted last-sync timestamp.
  - Verified database inspection action and academic index attribution.
- Created test suite:
  - `tests/SearchBar.test.tsx` (tests input rendering, value change, and clear interaction).
- Total tests: 13 suites, 47 tests passing.
- ESLint flat config, TypeScript check, and Android export passed with 0 errors and 0 warnings.
Completed:
- Verified and integrated live Space & Science endpoints:
  - NASA APOD replacement endpoint: `https://science.nasa.gov/wp-json/wp/v2/apod-basic/` (normalized date, stripped HTML tags, credit attribution, high-res images).
  - Spaceflight News API v4: `https://api.spaceflightnewsapi.net/v4/articles/` (normalized articles, authors, news sites).
  - Zod schemas validating remote payloads: `nasaApodResponseSchema`, `spaceflightFeedResponseSchema`.
- Implemented robust durable SQLite layer (`src/database/`):
  - `schema.ts`: WAL mode, parameterized queries, indexes on source/published_at/added_at.
  - `discoveryRepository.ts`: transactional upsert, conflict resolution preserving local offline image URIs, cached feed reader, single item by ID.
  - `favouritesRepository.ts`: persistent relational favourites join, instant local ID map.
  - `syncMetadataRepository.ts`: truthful lastSyncedAt and attempt tracking (never fabricated device time).
- Implemented persistent offline image caching (`src/services/storage/imageStorage.ts`):
  - Downloads remote image assets to app document directory when an item is favourited.
  - Stores `imageLocalUri` in SQLite; preferred for offline viewing.
- Implemented network observer (`src/services/network/networkObserver.ts`):
  - Monitors connectivity with `@react-native-community/netinfo`.
  - Automatically triggers feed refresh upon reconnection without duplicating items or erasing favourites.
- Implemented Redux Toolkit slices (`src/store/slices/`):
  - `feedSlice.ts`: SQLite-first initialization (`loadCachedFeedThunk`), remote synchronization (`syncRemoteFeedThunk`), category filtering, search.
  - `favouritesSlice.ts`: SQLite favourites management and image download orchestration.
- Built editorial UI components:
  - `OfflineBanner.tsx`: sage-themed banner displaying truthful sync timestamp and retry action.
  - `DailyPlateCard.tsx`: 342x245 hero card with overlay, brass badge, credit attribution.
  - `DispatchRow.tsx`: compact article row with thumbnail, editorial serif title, source badge.
  - `CategoryChips.tsx`: accessible filter tabs.
  - `EmptyState.tsx`: empty field shelf and first-launch offline screens.
  - `FavouriteButton.tsx`: selected assignment bonus using React Native Reanimated bounce/spring animation.
- Implemented full screens:
  - `app/(tabs)/index.tsx`: Discover feed with pull-to-refresh, offline banner, Daily Plate hero, Space Dispatches list.
  - `app/details/[source]/[id].tsx`: Loads directly from SQLite before remote fallback; full provenance, notes, and canonical link.
  - `app/(tabs)/favourites.tsx`: The Field Shelf with persistent favourites and offline asset display.
- Created test suites:
  - `tests/discoveryNormalization.test.ts` (NASA APOD & Spaceflight News Zod validation and HTML stripping).
  - `tests/sqliteRepositories.test.ts` (idempotent upserts, duplicate prevention, favourite persistence across refresh, sync metadata).
  - `tests/offlineBanner.test.tsx` (offline alert, formatted timestamp, retry button).
  - `tests/favouriteButton.test.tsx` (accessibility states and animated toggle interaction).
- Total tests: 12 suites, 45 tests passing.
- ESLint flat config, TypeScript check, and Android export passed with 0 errors and 0 warnings.
Completed:
- Designed and implemented `src/navigation/types.ts`:
  - Enforced strict typed routing parameters: `{ source: 'nasa-apod' | 'spaceflight-news', id: string }`.
  - Added parameter normalization and decoding to prevent passing entire serialized objects across routes.
- Created `src/components/common/BrandReveal.tsx`:
  - Implemented the three-phase in-app reveal motion per `docs/LAUNCH_MOTION.md` using React Native Reanimated.
  - Added native `AccessibilityInfo.isReduceMotionEnabled()` check to immediately resolve when user has enabled reduced motion.
  - Eliminated wrong-route flashing and blank splash screens during initial session hydration.
- Implemented `src/components/common/Header.tsx`:
  - Accessible editorial screen header with `PlayfairDisplay` titles, safe area insets handling, and accessible back navigation with >=48dp touch targets.
- Created test suites:
  - `tests/navigationParams.test.ts` (verifies valid parameters, decodes encoded IDs, rejects unsupported sources/empty IDs).
  - `tests/Header.test.tsx` (verifies title, subtitle rendering, and back button interaction).
- All 8 test suites (30 tests), ESLint flat config, TypeScript check, and Android export passed with 0 errors and 0 warnings.
Completed:
- Implemented `src/services/storage/secureStore.ts`:
  - Token storage strictly isolated to OS-backed `expo-secure-store`.
  - Zero sensitive auth tokens stored in MMKV, SQLite, AsyncStorage or Redux state.
  - Safe session clearing upon sign out.
- Implemented Zod validation schemas in `src/services/auth/authSchemas.ts`:
  - `loginSchema` with non-empty username/password constraints.
  - `registerSchema` with name, username regex, valid email, and password matching constraints.
  - `dummyJsonLoginResponseSchema` validating external API responses.
- Implemented `src/services/auth/dummyJsonAuth.ts`:
  - Integrated `POST https://dummyjson.com/auth/login` and `POST https://dummyjson.com/users/add`.
  - Added session restoration via `GET https://dummyjson.com/auth/me` with Bearer token.
  - Classified errors cleanly: `INVALID_CREDENTIALS`, `NETWORK_ERROR`, `VALIDATION_ERROR`.
  - Disclosed simulation for academic account creation.
- Built reusable editorial form components:
  - `src/components/common/Button.tsx`: primary, outline, and danger variants with loading indicator and >=48dp touch targets.
  - `src/components/common/Input.tsx`: custom editorial field with focus states, error messages, and password toggle.
- Created Redux Toolkit auth slice in `src/store/slices/authSlice.ts`:
  - `loginThunk`, `registerThunk`, `restoreSessionThunk`, `logoutThunk`.
  - Configured Redux store with typed hooks (`useAppDispatch`, `useAppSelector`).
- Implemented Figma v2 screens:
  - `app/(auth)/login.tsx`: branded editorial login with demo autofill helper (`emilys` / `emilyspass`).
  - `app/(auth)/register.tsx`: simulated registration with explicit academic disclosure.
  - `app/_layout.tsx`: integrated Redux provider and reactive auth gate routing.
  - `app/(tabs)/profile.tsx`: observer session display with user name, email, security badges, and working logout action.
- Wrote unit and integration tests:
  - `tests/authValidation.test.ts`
  - `tests/dummyJsonAuth.test.ts`
  - `tests/secureStore.test.ts`
  - `tests/authSlice.test.ts`
- All 6 test suites (23 tests), ESLint flat config, TypeScript check, and Android export passed with 0 errors and 0 warnings.

## 2026-11-23 — Local authentication and protected navigation

Verified-session restore now opens the app directly from SecureStore. The online check can refresh credentials or revoke a rejected session. Sign-out and stale validation are ordered so the signed-out session cannot be restored by a late response. Expo Router protects tabs and Details, and route validation handles malformed IDs. Jest (49 tests), ESLint, and TypeScript passed.

## 2026-11-23 — Durable feeds, bookmarks and media

SQLite now migrates existing data to source snapshots and account-owned bookmarks. Source commits replace membership and advance timestamps atomically, including a valid empty response. A failed feed retains its last successful collection. The app hydrates before synchronizing, and reconnection is coordinated from the authenticated shell.

Bookmarks commit before media work. Durable downloads use bounded streaming, temporary files, format checks, and explicit waiting/ready/failed states. NASA's live November 22 APOD included a Creative Commons license, which is now retained and exposed with its credit. Verified HTTP 200 for both configured feeds and NASA's direct date lookup. Jest (51 tests, including actual SQLite migrations and rollback), ESLint, and TypeScript passed.

## 2026-11-23 — Editorial UI and accessibility

The shipped layouts now follow the approved v2 compositions. The dark launch and authentication mastheads use the approved ivory mark and credited NASA Earthrise photography. Discover and Details use live source photos with stable search, separated open/save targets, and useful error and offline states. Profile shows real source and storage values. Confirmed saves drive the reduced-motion-aware bookmark animation. TypeScript, ESLint, 51 Jest tests, and an Android bundle export passed. The bundle now lists the six used editorial font faces and Feather.

## 2026-11-23 — Offline Field Journal

An account-owned favourite can carry one private field note. Notes can be added, searched, edited, and removed through the app without a network request. The Shelf also filters by notes and confirmed downloaded images, and sorts by saved or publication date. Removing a bookmark with a note asks for confirmation. Runtime Redux inspection is disabled for private state. TypeScript, ESLint, and 53 Jest tests passed.

## 2026-11-23 — Release verification and submission evidence

A device test exposed an unmatched root route before sign-in. An explicit public entry route now resolves the locally restored session and opens the permitted stack. The note editor uses a keyboard-safe compose view after the inline editor fell below the Android keyboard.

Verified on a self-contained ARM64 Android release with Metro stopped. A fresh offline launch reached sign-in. Three favourites and a licensed Jupiter image survived force-stop, reinstall, and an airplane-mode relaunch. The note reopened, was edited, and was found by text search while offline. Both source timestamps advanced on reconnect. Discover rendered at 320/360/390/430 dp at 1.3× font scale. Sign-out survived a further force-stop.

Clean npm installation, final ESLint, strict TypeScript, 57 Jest tests, Android native release build and lint, and the iOS bundle export passed. No native iOS simulator runtime was available. Six device screenshots replaced the previous captures. The local narrated review cut is 170.02 seconds and passed full video/audio decoding.

## 2026-11-23 — Smart Reading reliability slice

Routine foreground refresh now uses a 15-minute freshness window. Reconnect and explicit retry still refresh immediately. An offline Details miss can retry when the focused reader reconnects. Saved images record their source revision and license. The reader reports failed local decoding and can show an earlier licensed file while a replacement is pending. Local archive failures take precedence over empty search results. TypeScript, ESLint, and 57 Jest tests passed.

## 2026-11-23 — Smart Reading slice

Discover now offers Continue Reading, offline library search, and Browse by date. Reading progress stores a semantic paragraph anchor per account. A dated lookup populates only the local archive. Private note search remains in the Field Shelf. A date-entry modal keeps the action accessible while the keyboard is open. The new regression tests cover checkpoint ownership and retention, accent folding and title ranking, exclusion of private notes, and a thousand-record search. TypeScript, ESLint, and 60 Jest tests passed.

## 2026-11-23 — Smart Reading release verification

Android kept all three bookmarks on upgrade. An airplane-mode cold launch restored the current library and the Cocoon Nebula reading checkpoint. Offline search found the same plate. An uncached date initially showed the offline state and opened automatically when the connection returned. The dated lookup, resume card, search results, and offline journal have refreshed screenshots.

The first set of five cached cold launches had a 3.08-second median on the emulator. Session restore now starts alongside font loading. The branded reveal and protected routes continue to run after the font state resolves. Clean-install ESLint, TypeScript, 60 Jest tests, and the updated iOS bundle export passed.

Android native lint and the optimized release build passed. The final signed ARM64 APK retained three bookmarks and supported offline search and marking a plate as read after a cold start. The five-run median was 3.14 seconds on the emulator, so the 2.5-second target remains open. Larger-text checks covered Discover, Shelf, Details, the note editor and Profile at four widths. TalkBack focus reached Discover search and Details back.

The revised narrated demo lasts 169.02 seconds. It includes Android screenshots and footage followed by a code walkthrough. Full audio and video decoding succeeded. See [verification scenarios and release checks](TEST_PLAN.md).

## 2026-11-23 — Native splash handoff

The launch recording exposed a white native frame before the forest reveal. Expo's native splash configuration now uses the existing ivory mark and forest background. Android registers Expo's splash manager before starting React and scopes the icon preference to API 33 and newer. ESLint, TypeScript, 60 Jest tests, Android lint and the signed ARM64 QA build passed. The installed APK cold-launched to cached Discover in airplane mode.

The final Android QA build reached cached Discover in a median of 2.32 seconds across five offline cold launches. This met the 2.5-second emulator target.

The native iOS release built in an isolated workspace and presented the normal sign-in screen on a locally signed iPhone 18 Pro simulator build. This check covered fresh startup. The full iOS offline flow and spoken screen-reader pass remain open.

## 2026-11-23 — Offline reading history

Mark as read now records an account-owned completion and clears that discovery's resume checkpoint in one SQLite transaction. The Field Shelf links to history and filters saved items with To read. The archive retains completed records across feed refreshes. TypeScript, ESLint, and the 11 focused SQLite and Field Journal tests passed.

## 2026-11-23 — Field Shelf collections

The Field Shelf opens a protected Collections screen. Accounts can create and rename collections, select existing favourites, and open their selections offline. SQLite enforces ownership and automatically removes memberships when a favourite is removed. Deleting a collection keeps its favourites and notes. TypeScript, ESLint, and the 10 SQLite repository tests passed.

## 2026-11-23 — On This Day

Discover looks for the most recent past NASA plate on the same month and day in SQLite. A cache miss offers a valid earlier date when connected and explains the offline state otherwise. Dated opens reuse the existing Details lookup and leave Discover's source snapshots intact. TypeScript, ESLint, and 12 focused date and SQLite tests passed.

## 2026-11-23 — Share a discovery

Details can open the native Android or iOS share sheet from a cached discovery. The payload is limited to the public title, credit, and validated original link. TypeScript, ESLint, and the two focused share-payload tests passed.

## 2026-11-23 — Offline reading packs

Discover offers A Tour of Saturn and Apollo at the Moon. SQLite commits each downloaded plate with the account's pack membership, so interrupted downloads can resume. The existing media worker handles eligible images and keeps a shared file while a bookmark or pack still owns it. Verified HTTP 200 and matching dates for all six NASA entries. The full 69-test Jest suite, ESLint, and TypeScript passed.

## 2026-11-23 — Archive extension verification

Android native lint and the optimized ARM64 release build passed. The Pixel 9 emulator restored the cached anniversary plate, reading completion, note, collection and Saturn pack after a force-stop in airplane mode. The pack's licensed image rendered from local storage without a bookmark. The Android share sheet displayed the public attribution and link. Apollo downloaded on reconnection. The README includes two screenshots from the offline run. The iOS bundle exported successfully. Native iOS behaviour for these extensions remains unverified.

## 2026-11-23 — Offline Sky Viewer

Discover opens a protected sky chart with manual panning, coordinate entry, and a labelled Colombo preview. The bundled catalog includes 80 stars, six Messier objects, the Moon, and seven planets. The chart and accessible object list open the same detail sheet with local summaries and source links. The Moon position matched the U.S. Naval Observatory reference within 0.2°. TypeScript, ESLint, seven focused tests, and the Android bundle export passed.

## 2026-11-23 — Phone pointing

Sky Viewer uses a foreground device location when permission is available, and it can use manual coordinates or a Colombo preview. It derives phone pointing from gravity and the magnetic field and corrects the bearing to true north. Manual controls remain available for missing readings and reduced-motion preferences. The Android release emulator verified location denial, approximate location, a direct chart marker tap, simulated sensor pointing, and manual fallback. TypeScript, ESLint, 12 focused tests, the Android release build, and the iOS bundle export passed. Physical-device pointing remains open.

## 2026-11-23 — Offline satellite predictions

Sky Viewer validates CelesTrak elements for the ISS and Hubble, caches them in SQLite, and calculates predictions locally. The viewer labels older orbit data and hides predictions once the elements expire. The Pixel 9 emulator upgraded from the previous release, downloaded both orbits while the viewer was open on reconnection, and retained both predictions after an airplane-mode force-stop. The Android package excludes the unused Expo background location services. TypeScript, ESLint, 86 Jest tests, the Android release build and native lint, and the iOS bundle export passed.

## 2026-11-23 — Space Study planning

Added [the Space Study implementation plan](../tasks/07-space-study.md) covering the in-app book, searchable atlas, offline city selection, Sky Viewer integration, catalog updates, and assignment release gates. This entry records planning only.

## Space Study guide and atlas

Added the bundled eight-chapter introductory edition, original supplemental profiles, searchable sky catalog, section reader, account bookmarks and offline reading checkpoints. The SQLite repository suite (14 tests), ESLint and TypeScript passed.

## Worldwide offline city lookup

Bundled 52,004 GeoNames places in an indexed database, with optional city selection, stored city preference, observing-zone time and direct links between supported atlas entries and sky positions. Checked Kandy, worldwide namesakes and database integrity. TypeScript, ESLint and all 88 tests passed.

## Study pack revisions and Starlink profiles

Added versioned static manifests, resumable verified parts, transactional installation and bookmark-preserving removal. Included a two-entry observatories supplement with the app. Added STARLINK-1008 and STARLINK-1012 from the 23 November 2026 CelesTrak catalog. ESLint, TypeScript and all 90 tests passed, including failed pack activation, account bookmarks and six-digit catalog IDs.

## Field Guide section anchors, notes and edition validation

Added stable chapter-section anchors, private study notes, per-chapter glossary entries, an accessible bundled Earthrise figure, and content/pack validation tests. Both selected Starlink GP endpoints returned matching NORAD identifiers. Strict TypeScript, ESLint and all 93 tests passed.

## Native pack-write verification

The first Pixel 9 pack-install check exposed the asynchronous native file-write contract. The installer now awaits writes and validates SHA-256 before parsing each part. Regression tests simulate delayed writes, connection loss after a complete part, insufficient free space and corruption. All 95 Jest tests, TypeScript, ESLint, Android release assembly and native lint passed.

## Sky Viewer location and refresh policy

Re-read the selected city when the viewer regains focus so multiple open viewer screens share the preference. Keep coordinate and device fixes out of persistent storage. Refresh due orbit data while the viewer remains active. A provider HTTP error now keeps requests paused across restarts until an explicit resume after the two-hour cooldown. Updated the guide’s small-body reference and bundled revision. All 95 tests, ESLint and TypeScript passed.

## Space Study release verification

The final ARM64 Android release build, Android native lint and iOS bundle export passed. All 95 Jest tests, strict TypeScript and ESLint passed. The Pixel 9 upgrade preserved the earlier Jupiter discovery bookmark. After a force-stop in airplane mode, the study bookmark reopened the Saturn rings section. Kandy was selected locally and restored after restart. The observatories pack installed offline, and its bookmarked Webb entry survived removal. On reconnection the final build calculated positions for ISS, Hubble and both selected Starlink spacecraft. A temporary Hermes harness measured the 95th percentile at 22.8 ms over 60 local first-page query and layout samples. The QA APK was restored after measurement.

An iPhone 17 simulator running Expo Go exercised the native reader. XCTest passed section navigation and bookmarking. Physical handset GPS accuracy and pointing calibration remain unverified. Revision-one assets are local and bundled. A production-hosted update requires publication of the repository assets. The local narrated review cut is 144.62 seconds, includes audio, and passed full decoding. The student still needs to review the original science content and final narration.

## Editorial control refresh

Added platform material selection, primary and tonal actions, destination rows and a circular back control. TypeScript, ESLint and four focused tests passed. Tests cover live Reduce Transparency changes and the accessible loading state.

The floating tab bar retains Expo Router tab presses, selection and keyboard handling. Each tab uses the router's measured bar height plus its safe-area offset for scroll clearance.

Discover places the Daily Plate before resume reading and groups secondary tools behind an accessible disclosure. Details differentiates the saved action with a checkmark. TypeScript, focused ESLint and eight reading/control tests passed.

The Shelf groups its three archive destinations in one row. Discover and Favourites share checked filter chips. Form labels are larger and secondary actions use the tonal treatment across authentication and Profile.

Space Study uses destination rows for editions, related reading and sky links. The manual sky controls share a floating capsule beneath the chart. Android release assembly and native lint passed.

## Floating controls accessibility verification

The native accessibility hierarchy exposed decorative Feather glyphs in tab names. Android also retained offscreen tab controls while the search keyboard was open. Tabs now have explicit names and unmount during keyboard entry. On the final Android release, the accessibility tree lost the tab controls during typing and restored them on dismissal. All 99 Jest tests, strict TypeScript and full ESLint passed.

## Device evidence and review cut

The Pixel 9 Android 17 emulator ran the locally signed ARM64 release. The public demo login loaded both sources. Saving the Daily Plate, opening Shelf tools and the collection editor, and reopening its original credit after a force-stop in airplane mode succeeded. Reconnection restored the source refresh controls. The manual sky toolbar panned the Colombo preview. Tab labels and 48 dp hit areas were checked at 320, 360, 390 and 430 dp, including 1.6× text at 320 dp. Sign out scrolled above the floating bar in three-button navigation.

The iPhone 17 simulator on iOS 27.2 displayed the glass bar in Expo Go. XCTest selected Favourites, opened Shelf tools, selected Profile and returned to Discover. The production iOS JavaScript export completed. Standalone iOS signing and physical-device VoiceOver/TalkBack listening were outside these simulator checks. The app retains its existing portrait orientation.

Updated screenshots show the core journey, iOS tabs, manual sky toolbar and offline provenance. The local Android QA APK is `dist/cosmolog-editorial-qa.apk`. The H.264/AAC narrated cut is `dist/cosmolog-editorial-demo.mp4` and decoded successfully at 149.37 seconds.

The iOS navigation XCTest also passed with Accessibility Large text and Increase Contrast enabled. The simulator settings were restored after the check.

## Magazine identity
Replaced the launcher and editorial lockup with a cut C and outlined Playfair lettering. Exported transparent foregrounds, monochrome artwork, density-specific launch icons and a matching native splash.

Discover now keeps the edition selector above a shared photo cover. Each source gets its own lead and chronological remainder. The centred dock targets 264 points at normal text size. Edition tests cover deduplication, single-source and empty caches.

The cut C now opens into the outlined masthead on a five-second cold launch. Skip, Reduce Motion and timer completion share one handoff. Two launch regression tests, TypeScript and ESLint passed.

Reworked auth, article, Shelf and Profile layouts. The article opens with publisher, date and title before the image and credit. Shelf search and saved discoveries precede its management links. Discovery empties occupy the cover position.

The Field Guide now presents an editorial contents list, the reader displays its section position, and downloads and reading packs use ruled panels. The Sky Viewer places the chart before observing notes and object profiles share the same editorial heading treatment. All 105 tests, strict TypeScript and ESLint passed.

The source selector now reserves identical geometry for each state and indicates selection with a terracotta rule. The dock measures the longest label at the active system text size before choosing its width.

### Paginated Space Dispatches
Added a durable dispatch continuation, merged refreshes and bounded list reads. Older stories remain readable offline. The list footer supports manual loading and retry.

### Online dispatch search
Discover now searches normalized SQLite text and pages Spaceflight News independently of the feed. Search membership is account-scoped, transactional and excluded from cache pruning.

### NASA Media and wider-web discovery
Added NASA catalogue search, typed media Details, source credits, per-provider pagination and an explicit browser action. Live responses confirmed the NASA Europa preview and identified an unsupported secondary news ordering, now removed.

### Discovery verification
The full Jest run passed 113 tests across 33 suites. TypeScript and ESLint passed. Gradle assembled the standalone ARM64 Android release, including its packaged JavaScript bundle. Live provider requests returned Europa news and images and identified NASA audio and video records with spaces in their IDs. The existing magazine demo measured 141.78 seconds.

### Magazine release verification

The Android ARM64 APK and the iOS simulator release use redesign revision `345bf3f`. All 105 Jest tests, TypeScript, ESLint, Android release assembly and release lint passed for this redesign. The isolated APK source map matched all 104 comparable application modules. Later pagination and online-search changes in the shared checkout have their own verification.

On the Pixel 9 API 37 emulator, clean sign-in, three covers with the same selector bounds, bookmarking, an offline cold restart and the saved article’s attribution passed. At widths of 360, 390 and 430 dp the tab hit areas measured 84 × 55 dp. At 320 dp with 160% system text all three targets remained centred and at least 48 dp. The APK uses a local QA signing key.

An unsigned iOS simulator build reached login but lacked Keychain access. The locally signed release passed the iPhone 17 / iOS 27.2 XCTest covering sign-in, all three editions, Shelf and Profile. [iOS device capture](screenshots/magazine/ios-discover.png). Physical hardware and store distribution signing remain unverified.

The original Figma file was view-only for the connected account. Its editable edition layouts, launch storyboard and screen references are in the [local handoff](../design/magazine/).

On a Pixel 9 emulator the standalone build reached “APOD: 2026 November 19 – The Horsehead and Flame Nebulas”, independently matched against the third live article page. After saving a NASA Europa record, the app force-stopped and restarted in airplane mode. Its ordered search reopened, Details showed the favourite was still saved, and the same third-page article appeared while scrolling offline. The latest search reopened again after reconnection. The test used Android accessibility labels to operate controls. Spoken TalkBack and iOS device checks remain unverified for this release.
