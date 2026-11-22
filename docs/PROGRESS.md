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
