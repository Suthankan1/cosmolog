# COSMOLOG narrated demo

Target duration **2 min 50 sec**. Record the app in an installed build with Metro stopped. Start online with the sign-in screen and an eligible APOD image available. Use the public demo account.

| Time | Screen or code | Narration cue |
| --- | --- | --- |
| 0:00–0:12 | Sign in and open Discover | COSMOLOG is a space and science archive for IN3210. Sign-in uses DummyJSON and the app reads NASA and Spaceflight News. |
| 0:12–0:25 | Open Daily Plate, save, wait for the image status | Details takes a source and an ID. Saving commits the record first. The image reports when a durable copy is ready. |
| 0:25–0:37 | Add a short note and open the Shelf | The Field Shelf keeps this discovery and my note together. Both are available on this device. |
| 0:37–0:53 | Show airplane mode and a force-stop, reopen from the launcher | This is a cold launch with the network off. A previously verified session opens the last collection from SQLite. |
| 0:53–1:05 | Open the saved record and note, then reconnect | The downloaded image and note still open. When the device reconnects, sources refresh automatically. |
| 1:05–1:25 | `app/_layout.tsx` and `src/navigation/types.ts` | Expo Router guards tabs and the Details stack. The route only carries the two identifiers, which are validated. |
| 1:25–1:45 | `src/services/storage/secureStore.ts` and `src/store/slices/authSlice.ts` | SecureStore holds the verified identity and tokens. DummyJSON can refresh or revoke the session when online. |
| 1:45–2:10 | `src/store/archiveLifecycle.ts` and `src/database/repositories/discoveryRepository.ts` | SQLite hydration happens first. Redux Toolkit thunks coordinate refresh, and each source commits its list and successful timestamp in one transaction. |
| 2:10–2:31 | `src/database/repositories/favouritesRepository.ts` and `src/services/storage/imageStorage.ts` | Bookmarks belong to an account. Notes update locally, and image files are validated before the database calls them available. |
| 2:31–2:50 | `tests/sqliteRepositories.test.ts`, `tests/feedSync.test.ts`, and final test results | The tests exercise migration, account ownership, rollback on a bad write, and the cases where only one source is available. |

Explain the decisions in your own words. Keep the final video below three minutes and separately verify the upload plays with audio.

## Local review cut

The generated local review cut is `dist/cosmolog-demo.mp4`. It combines actual Android emulator footage with a code walkthrough and synthetic narration. The export was checked at 170.02 seconds with playable H.264 video and AAC audio. The student can review or replace the narration before submission.
