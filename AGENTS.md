# Agent instructions — COSMOLOG

You are working in the COSMOLOG project for IN3210 Assignment 2. Treat `PROJECT_CONTEXT.md`, `docs/ASSIGNMENT_REQUIREMENTS.md`, and `design/` as the project source of truth.

## Before acting
1. Read `PROJECT_CONTEXT.md`.
2. Read `docs/ASSIGNMENT_REQUIREMENTS.md`.
3. Read the relevant task file in `tasks/`.
4. Inspect the current repository state; do not overwrite existing work.
5. Check official documentation for current package/API behaviour when needed.

## Hard constraints
- Domain: Space & Science.
- Twist: offline-first. The last loaded list and all favourites must work offline; show offline status; refresh on reconnection.
- DummyJSON auth is compulsory.
- Auth token must use OS-backed secure storage (Expo SecureStore). Never AsyncStorage/MMKV/SQLite/Redux persistence for auth tokens.
- Expo Router or React Navigation; use a separate auth flow, bottom tabs and typed route params.
- Details receives item ID/source, not the whole object.
- Redux Toolkit is compulsory. RTK Query is the selected default for remote request lifecycle; explain deviations.
- Favourites persist across app restarts.
- TypeScript throughout.
- Feather icons for interface icons as required by the assignment.
- Minimum three meaningful automated tests; target five or more.
- ESLint must pass.
- Feature-based commits; never bundle the whole project into one final commit.
- README, screenshots, architecture, state choice, Key decisions and AI_USAGE.md are required.
- Demo video must be no longer than three minutes.

## Engineering rules
- Local SQLite is the durable read path for cached content and favourites.
- Do not assume RTK Query memory cache survives process death.
- Do not assume an image-library disk cache is permanent.
- Preserve original source attribution and original links.
- Never claim stale content is live.
- Do not fabricate last-sync timestamps.
- Validate and normalize external API responses before persistence.
- Use parameterized SQL queries.
- Do not store credentials or tokens in logs.
- Do not disable TLS certificate/hostname validation.
- Ask for only necessary permissions; location, camera and microphone are not required for the core app.
- No custom backend unless a demonstrated requirement justifies it.
- Do not add optional sensor features before the required offline flow is complete.
- Respect reduced-motion preferences.

## Design rules
- Follow `design/DESIGN_SYSTEM.md` and `design/SCREEN_SPECIFICATIONS.md`.
- V2 editorial palette: ivory `#F8F4EA`, forest `#184235`, terracotta `#C1654A`, brass `#C79B4D`, sage `#A8B89A`, ink `#2C2A27`.
- Playfair Display for editorial headings/wordmark; Inter for interface text. Do not implement archived v1 screens.
- No black/neon-blue/purple default AI theme, glow, generic rocket/planet art or unnecessary gradients.
- Minimum touch target 48 dp Android / 44 pt iOS; prefer 48 dp consistently.
- All screens need loading/error/empty/online/offline behaviour where relevant.
- Use Feather icons consistently, not emoji as production icons.

## Work style
- Implement tiny vertical slices with tests and feature-level commits.
- Explain the purpose and trade-offs of unfamiliar concepts.
- Avoid generating large unreviewed code dumps.
- Do not start the next slice until the current slice's checks pass.
- Record decisions and progress in `docs/PROGRESS.md`.
- Do not claim tests, builds, API checks or device checks ran unless they actually did.
- Before changing architecture or dependencies, explain why and update `docs/DECISIONS.md`.
- The student is responsible for understanding and validating every line submitted.

## Definition of done for each slice
- Focused tests pass.
- Relevant typecheck/lint/build checks pass.
- Loading/error/empty/offline states are considered.
- No secrets or sensitive logs.
- Feature is documented.
- A small commit is prepared with a descriptive message.
