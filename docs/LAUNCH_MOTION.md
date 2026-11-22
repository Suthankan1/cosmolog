# COSMOLOG v2 — Native splash and in-app motion

Figma storyboard: https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N?node-id=21-2

**Platform constraint:** Android and iOS launcher icons are static application assets. Animate the in-app launch reveal, not the operating-system icon.

The Expo SplashScreen plugin in `app.json` defines the forest background and ivory mark for native generation. The checked-in Android project mirrors those resources and registers Expo's splash manager before React starts. Regenerate the splash resources when the mark or the native theme changes. [Expo SplashScreen configuration](https://docs.expo.dev/versions/latest/sdk/splash-screen/#configuration)

## Motion sequence
1. **Static native splash** — brand mark on forest background. No blank flash.
2. **0–180 ms** — ivory crescent path emerges with ease-out.
3. **180–590 ms** — brass orbit, observation point and central star resolve.
4. **590–950 ms** — Playfair COSMOLOG wordmark and italic tagline fade/settle.
5. **After 950 ms** — release to authenticated Discover or Login; do not block actual app startup waiting for animation.

If reduced motion is requested, immediately show final mark/wordmark, then content. Avoid loops, spins, confetti or elaborate transitions.

## Export assets
- `assets/brand/cosmolog-mark.svg` — forest mark for light backgrounds.
- `assets/brand/cosmolog-mark.png` — transparent raster alternative.
- `assets/brand/launcher-icon.svg` — square forest app icon vector.
- `assets/brand/launcher-icon.png` — 1024px preview/export.
- `assets/brand/launcher-monochrome.svg` — Android-themed icon source.
- `assets/brand/cosmolog-lockup.svg` — editable wordmark source; requires Playfair Display installed to display exactly.

Validate Android adaptive icon crop/safe zone in a real release/preview build.
