# COSMOLOG — 3-Minute Video Demonstration Script
**Course:** IN3210 Mobile Applications Development — Assignment 2  
**Student Index:** 234202J  
**Domain:** Space & Science (Last numeric digit: 2)  
**Assigned Twist:** Offline-First (Second-last numeric digit: 0)  
**Bonus Feature:** Smooth Reanimated Save / Favourite Micro-Interaction  
**Total Target Time:** ≤ 3 minutes (180 seconds)

---

## Part 1: Application Flow & User Experience (~60 Seconds)

### [00:00 – 00:15] Launch, Branded Motion & Authentication
- **Visual:** Open app. The dark forest green canvas loads with the COSMOLOG celestial crescent mark and sighting star smoothly resolving in a 3-phase Reanimated reveal, settling into the Login screen.
- **Narration:**
  > "Hello, this is COSMOLOG—an editorial Space and Science discovery journal built for IN3210 Assignment 2 by student index 234202J.
  > On initial launch, the app smoothly performs a brand reveal respecting reduced motion, and gates on our authentication flow.
  > I'll tap the demo helper button to populate our DummyJSON credentials—Emily Johnson (`emilys` / `emilyspass`)—and sign in.
  > The authentication token is strictly persisted using OS-backed Expo SecureStore."

### [00:15 – 00:30] Discover Feed & Science Provenance
- **Visual:** Lands on Discover tab. Top shows 'THE DAILY PLATE' (live NASA APOD image of Jupiter swirls, date, credit). Below shows Category Chips ('All Dispatches', 'The Daily Plate', 'Spaceflight Missions') and real-time Search. Scroll through spaceflight news dispatches.
- **Narration:**
  > "We are now on the Discover screen. Notice the editorial ivory, forest green, and brass palette from our approved Figma V2 redesign.
  > At the top is The Daily Plate, streaming live from science.nasa.gov. Below are live mission dispatches from Spaceflight News API v4.
  > Real-time search instantly filters across titles, summaries, and authors.
  > I can tap on any dispatch or plate to open its full Details screen."

### [00:30 – 00:45] Discovery Details & Reanimated Bonus Interaction
- **Visual:** Tap Jupiter Daily Plate. Detail screen pushes with hero image, provenance badges, full observation notes, credit, and canonical link. Tap the bookmark icon in the header—it bounces with a spring animation.
- **Narration:**
  > "The Details screen receives only the item's source and ID—never a full object. It reads directly from our local database before remote fallback.
  > When I tap the bookmark icon to save this to 'The Field Shelf', notice the smooth Reanimated spring bounce—this is our selected assignment bonus.
  > The app immediately downloads a durable copy of the image file to local storage so it remains visible without network."

### [00:45 – 01:05] The Field Shelf, Airplane Mode & Cold Offline Restart (Twist)
- **Visual:** Switch to 'The Shelf' tab. The saved plate appears. Pull down control center, enable Airplane Mode (disable Wi-Fi and Cellular). Force close / terminate the app. Cold restart the app offline.
- **Narration:**
  > "Now for our compulsory twist: Offline-First.
  > In 'The Field Shelf', our saved discoveries are displayed.
  > I'll now enable Airplane Mode and terminate the application completely.
  > When I cold-restart COSMOLOG without an internet connection:
  > The app reads directly from SQLite—our previously loaded feed, our full Field Shelf, and high-resolution images load instantly without waiting for a network timeout.
  > The Sage-tinted Offline Field Mode banner appears at the top, displaying the truthful last-synchronization timestamp.
  > When I re-enable connectivity, the app automatically refreshes without duplicating records or erasing favourites."

---

## Part 2: Technical Walkthrough & Code Architecture (~120 Seconds)

### [01:05 – 01:35] Project Structure & Navigation Architecture
- **Visual:** Open IDE to project root, `app/` folder, and `src/navigation/types.ts`.
- **Narration:**
  > "Turning to the codebase: COSMOLOG is implemented in Expo SDK 58, React 19, and strict TypeScript.
  > We use file-based Expo Router with a strictly separated route hierarchy:
  > `app/(auth)` contains our Login and simulated Registration screens with Zod and React Hook Form validation.
  > `app/(tabs)` implements the three core bottom tabs: Discover, The Field Shelf, and Field Log Profile, styled with vector Feather icons.
  > In `src/navigation/types.ts`, `parseDetailsParams` strictly enforces that routes pass only `{ source, id }`, ensuring clean decoupled boundaries."

### [01:35 – 02:05] State Management & Local SQLite Persistence
- **Visual:** Open `src/store/` and `src/database/`. Highlight `db.ts`, `schema.ts`, and `discoveryRepository.ts`.
- **Narration:**
  > "For state management, we use Redux Toolkit.
  > However, per architectural decision ADR-002, durable persistence is owned by on-device SQLite, not transient in-memory Redux or volatile cache.
  > In `src/database/schema.ts`, we maintain three indexed tables with WAL mode:
  > `cached_items` stores validated normalized observations from NASA and Spaceflight News.
  > `favourites` stores the relational join for user-saved items.
  > `sync_metadata` records truthful sync timestamps—we never fabricate device timestamps.
  > In `discoveryRepository.ts`, `upsertDiscoveryItems` uses parameterized queries inside a transaction and preserves `image_local_uri` so refreshes don't purge downloaded offline assets."

### [02:05 – 02:35] Security, Networking & Image Storage
- **Visual:** Open `src/services/storage/secureStore.ts` and `src/services/storage/imageStorage.ts`.
- **Narration:**
  > "For security: in `secureStore.ts`, authentication tokens are stored exclusively in OS-backed Expo SecureStore. No credentials or tokens are ever placed in SQLite, Redux persistence, or debug logs.
  > In `imageStorage.ts`, when a user favourites an item, we persist the image asset into the app's document directory via `expo-file-system/legacy`.
  > In `networkObserver.ts`, NetInfo listens for reconnection events, triggering seamless background re-syncs."

### [02:35 – 03:00] Verification, Test Suite & Wrap-Up
- **Visual:** Terminal running `npm test`, showing 13 passed suites (47 tests), followed by `npm run lint` and `npm run typecheck`.
- **Narration:**
  > "For quality assurance, our automated test suite includes 13 test suites and 47 automated tests covering input validation, Zod normalization, SQLite repositories, SecureStore isolation, and Reanimated UI components.
  > ESLint 9 with flat config and TypeScript strict mode pass with zero errors and zero warnings.
  > In summary, COSMOLOG demonstrates clean mobile architecture, robust offline-first durability, genuine science data, and an authentic editorial visual identity.
  > Thank you!"
