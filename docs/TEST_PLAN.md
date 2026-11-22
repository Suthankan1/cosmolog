# Verification

## Automated checks

Run lint, TypeScript and Jest after a clean `npm ci`. The 57 checks exercise form validation, credential-free Redux actions, local session restore, token refresh, route validation, source normalization, SQLite migration and rollback, source-level retries, media status, account ownership, and note editing and search.

The repository integration tests use a real SQLite database through Node's driver and an adapter with separate read and write connections. The Android build is separately responsible for exercising Expo SQLite, SecureStore, FileSystem, NetInfo, and React Native UI.

## Device acceptance

1. Install a self-contained Android build and verify Metro is stopped. Open a fresh install offline and confirm it displays sign-in. Reconnect and use the public demo account.
2. Open the live Daily Plate, save it, wait for its available-image status, and add a field note. Save two additional dispatches. Confirm the Shelf shows all three entries.
3. Enable airplane mode and force-stop the process. Launch again. Confirm Discover opens directly, shows the cached list and a last successful source update, and displays the offline banner.
4. Open the saved photo from the Shelf. Verify the real image and note render. Edit the note and search for it with airplane mode still active.
5. Restore connectivity and check the two source dates in Profile without pressing Refresh. Confirm the three saves persist.
6. Check Discover at 320, 360, 390, and 430 dp with larger text. Check sign-out across process death. Review the app with a screen reader and system reduced motion on a supported test device.

## Evidence from 23 November 2026

- Clean npm installation succeeded. Final ESLint, strict TypeScript, and 57 Jest tests passed.
- Live NASA list and direct date requests and the Spaceflight News list returned HTTP 200. The release app signed in through DummyJSON and displayed both sources.
- The signed ARM64 QA release built with JDK 21 and included the JavaScript bundle. The packaged manifest excluded broad storage and overlay permissions.
- The Pixel 9 API 37 emulator verified fresh offline sign-in and a force-stopped offline relaunch. Three bookmarks, a downloaded Jupiter image, and a private note reopened after reinstall and process termination. The note was then edited and searched in airplane mode.
- The two source timestamps advanced automatically after reconnecting. Discover rendered at 320, 360, 390, and 430 dp at 1.3× font scale. Sign-out persisted after another force-stop. The reduced-motion bookmark path passed a focused test. A full screen-reader pass remains a manual device check.
- Actual emulator screenshots are in [the screenshot directory](screenshots). The iOS bundle exported. Native iOS device verification is pending because the installed simulator runtimes were unavailable.
