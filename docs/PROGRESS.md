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
