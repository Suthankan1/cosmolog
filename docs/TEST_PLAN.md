# Verification

## Automated checks

Run lint, TypeScript and Jest after a clean `npm ci`. The 69 checks cover authentication, routes, source normalization and retries, SQLite migrations and rollback, media status, account ownership, checkpoints, search, collections, reading history, plate anniversaries, public share content, and pack recovery. The public archive search test uses 1,000 records, checks the match count and 100-item display limit, and enforces a 1.5-second bound on the repository call in the test environment.

The repository integration tests use a real SQLite database through Node's driver and an adapter with separate read and write connections. The Android build is separately responsible for exercising Expo SQLite, SecureStore, FileSystem, NetInfo, and React Native UI.

## Device acceptance

1. Install a self-contained Android build and verify Metro is stopped. Open a fresh install offline and confirm it displays sign-in. Reconnect and use the public demo account.
2. Open the live Daily Plate, save it, wait for its available-image status, and add a field note. Save two additional dispatches. Confirm the Shelf shows all three entries.
3. Enable airplane mode and force-stop the process. Launch again. Confirm Discover opens directly, shows the cached list and a last successful source update, and displays the offline banner.
4. Open the saved photo from the Shelf. Verify the real image and note render. Edit the note and search for it with airplane mode still active.
5. Restore connectivity and check the two source dates in Profile without pressing Refresh. Confirm the three saves persist.
6. Check Discover at 320, 360, 390, and 430 dp with larger text. Check sign-out across process death. Review the app with a screen reader and system reduced motion on a supported test device.
7. Browse to 2014-09-18, scroll into the article, return to Discover and confirm the Continue Reading card. Force-stop in airplane mode. Check that Resume Reading returns to the article text and that searching for `cocoon` finds the archived plate. At the end of the article, mark it as read and check that the card disappears on returning.
8. While offline, open an uncached date such as 1995-06-16. Confirm Details shows that the plate is unavailable offline. Restore connectivity with Details still open and check that the article loads without an extra action.
9. Measure five cached airplane-mode cold launches from the Android launch command to visible Discover content. Compare the median with the 2.5-second target. Ask three students to find a dated plate, resume reading after reconnect or relaunch, then find a saved note. Record task completion, mistakes and comments.

## Pre-Smart Reading evidence from 23 November 2026

- Clean npm installation succeeded. Final ESLint, strict TypeScript, and 57 Jest tests passed.
- Live NASA list and direct date requests and the Spaceflight News list returned HTTP 200. The release app signed in through DummyJSON and displayed both sources.
- The signed ARM64 QA release built with JDK 21 and included the JavaScript bundle. The packaged manifest excluded broad storage and overlay permissions.
- The Pixel 9 API 37 emulator verified fresh offline sign-in and a force-stopped offline relaunch. Three bookmarks, a downloaded Jupiter image, and a private note reopened after reinstall and process termination. The note was then edited and searched in airplane mode.
- The two source timestamps advanced automatically after reconnecting. Discover rendered at 320, 360, 390, and 430 dp at 1.3× font scale. Sign-out persisted after another force-stop. The reduced-motion bookmark path passed a focused test. A full screen-reader pass remains a manual device check.
- Actual emulator screenshots are in [the screenshot directory](screenshots). The iOS bundle exported. Native iOS device verification is pending because the installed simulator runtimes were unavailable.

## Smart Reading candidate from 23 November 2026

- The Pixel 9 API 37 emulator upgraded the installed release and retained three bookmarks. NASA returned the plate for 2014-09-18. After an airplane-mode force-stop, Discover showed its offline banner, Continue Reading reopened at the stored paragraph, and local search found the cached plate. The previously bookmarked Jupiter article also showed its field note offline.
- An uncached 1995-06-16 lookup showed the offline state. After reconnection, the open reader automatically displayed *Neutron Star Earth*.
- Discover, Field Shelf, Details, the note editor and Profile were checked on the emulator at 320, 360, 390, and 430 dp with 1.3× text. The initial width checks used the build before the change to parallel startup.
- The date form at 320 dp and 1.3× text kept **Open plate** reachable above the keyboard and rejected February 30.
- The optimized ARM64 Android build and Android lint succeeded before the native splash correction. That APK reopened Discover and all three bookmarks in airplane mode. Offline search found the Cocoon Nebula plate and **Mark as read** cleared its checkpoint.
- Five offline force-stop launches on that APK reached visible cached Discover in 3.14, 3.95, 3.63, 2.47 and 3.10 seconds. The median of 3.14 seconds exceeded the 2.5-second target on this emulator. Timing started at the launch command and ended at the first screenshot that matched the cached Discover view.
- The forest splash correction then passed Android lint and a signed ARM64 QA release build with minification disabled. The installed build showed the forest splash, opened cached Discover and resumed the saved paragraph after an airplane-mode force-stop.
- The same five-run benchmark on the final signed QA build recorded 2.30, 1.99, 3.01, 2.32 and 2.67 seconds. The median was 2.32 seconds, meeting the 2.5-second emulator target.
- The iOS bundle exported, and the native iOS release built and reached sign-in on an iPhone 18 Pro simulator running iOS 27.2. The locally signed Xcode build exercised Keychain access during fresh startup. [Sign-in capture](screenshots/10-ios-login.png)
- The Smart Reading demo runs for 169.02 seconds. The 720p H.264 video and AAC audio decoded successfully. See [the demo script](DEMO_SCRIPT.md).
- TalkBack's focus indicator reached Discover search and the Details back control. Full spoken screen-reader flows, the iOS offline walkthrough, and the three student walkthroughs remain open.

## Archive extension checks

- Mark a saved discovery as read, reopen the Field Shelf, and confirm **To read** excludes it. Reopen it from **Reading history** in airplane mode.
- Create two collections, add one favourite to both, then restart offline. Open it from either collection. Removing a collection keeps the favourite and its note.
- Open **On This Day** online, then revisit it offline after the dated plate is cached. Confirm the NASA publication date is from an earlier year.
- From cached Details, open **Share discovery** with a private note present. Check the share preview for the title, credit, and original link.
- Download **A Tour of Saturn**. Confirm the three plates and the eligible image can be opened from the pack after an airplane-mode cold restart. Switch accounts to check pack ownership. Reconnect and retry a partial download.

The updated ARM64 Android release built and passed native lint. In a clean Pixel 9 API 37 emulator, **On This Day** retrieved the 23 November 2025 plate and reopened it offline. **To read** excluded a completed favourite. After a force-stop in airplane mode, the Saturn study collection reopened with both favourites and its note, and reading history retained the completion. The Android chooser displayed the public title, credit, and original URL from cached Details. Its preview excluded the field note. The Saturn pack retained all three plates and rendered its licensed image in Details without a bookmark. After reconnection, the Apollo pack downloaded all three plates. [Offline collection](screenshots/11-offline-collection.png) · [Offline reading pack](screenshots/12-offline-reading-packs.png)

SQLite and Jest verified account isolation, interrupted download retries, and retention of shared media when a bookmark or another pack still owns it. The iOS JavaScript bundle exported successfully. Native iOS behaviour for these extensions remains unverified.
