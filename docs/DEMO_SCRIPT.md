# COSMOLOG Smart Reading demo

Target duration **2 min 49 sec**. Use the self-contained Android build with Metro stopped. Use the public DummyJSON demo account and verify the downloaded image has an available offline status before starting.

| Time | Screen or code | Narration cue |
| --- | --- | --- |
| 0:00–0:11 | Sign in and Discover | Accounts sign in through DummyJSON. Discover collects NASA astronomy plates and Spaceflight News dispatches. |
| 0:11–0:22 | Daily Plate and Field Shelf | Saving commits the bookmark first. Eligible images download separately. |
| 0:22–0:31 | Browse by date and the Cocoon Nebula plate | Choose 2014-09-18 to open an archived NASA plate. The reader keeps its source and credit. |
| 0:31–0:53 | Airplane-mode cold launch, Continue Reading and offline search | The local archive survives a restart. Resume Reading returns to the saved paragraph. Searching for Cocoon finds the plate offline. |
| 0:53–1:04 | Field note with the offline banner | The saved note opens and can be edited offline. |
| 1:04–1:24 | `app/_layout.tsx` | Expo Router separates authentication, the tabs and Details. Details takes the source and ID. |
| 1:24–1:43 | `src/services/storage/secureStore.ts` | SecureStore restores a verified session offline. DummyJSON can refresh or revoke it when online. |
| 1:43–2:06 | `src/database/repositories/discoveryRepository.ts` | Redux Toolkit coordinates refresh. SQLite commits each source list and timestamp together. Reconnect can recover an open uncached plate. |
| 2:06–2:29 | `src/database/repositories/readingRepository.ts` | SQLite stores the paragraph index and article fingerprint per account. The reader waits for layout before restoring it. |
| 2:29–2:49 | `tests/sqliteRepositories.test.ts` | Sixty checks include migrations, account ownership and a thousand-record archive search. The installed Android build was separately exercised in airplane mode. |

## Local review cut

`dist/cosmolog-smart-reading-demo.mp4` uses Android emulator footage, screenshots, code excerpts, and synthetic narration. The student can use these cues to explain the decisions in their own words. Verify the uploaded submission plays with audio and stays under three minutes.
