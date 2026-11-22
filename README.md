# COSMOLOG

**A pocket archive of the universe.**

COSMOLOG is an editorial space-science discovery journal for IN3210 Mobile Applications Development Assignment 2.

- **Student index:** 234202J
- **Domain:** Space & Science (last numeric digit = 2)
- **Required twist:** Offline-first (second-last numeric digit = 0)
- **Framework:** React Native + Expo + TypeScript
- **Deadline:** 13 December 2026, 11:59 PM
- **Status:** Fully redesigned v2 Figma foundation and brand assets prepared; application implementation has not started.

> Discover with curiosity. Keep what matters.

## Start here

1. Read [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) for the canonical product and technical decisions.
2. Read [`docs/ASSIGNMENT_REQUIREMENTS.md`](docs/ASSIGNMENT_REQUIREMENTS.md) before implementing.
3. Open the [Figma design file](https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N).
4. Read [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md) and [`design/SCREEN_SPECIFICATIONS.md`](design/SCREEN_SPECIFICATIONS.md).
5. Read [`AGENTS.md`](AGENTS.md) or the assistant-specific entry file for your coding agent.
6. Begin with `tasks/00-foundation-and-repo.md`. Do not start feature implementation until the design foundation is reviewed.

## Figma

[Figma — COSMOLOG Product & Visual Design](https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N)

Current v2 pages (at the top of the file):
- `00 — V2 / Reference`
- `01 — V2 / Brand System`
- `02 — V2 / Components`
- `03 — V2 / App Screens`
- `04 — V2 / States & UX Flows`
- `05 — V2 / Motion Storyboard`

The prior v1 pages are archived at the bottom; do **not** implement them. V2 contains seven fully editable primary mobile designs, five offline/empty/loading/error state screens, branded asset boards, reusable components/tokens, and a launch-motion storyboard.

Reference images used to direct the redesign are included under `design/references/`. Figma-generated astronomy photos are **illustrative**; production media must be sourced and attributed from real APIs.

## Product in one paragraph

COSMOLOG combines a daily astronomy feature, source-attributed spaceflight dispatches, and a persistent personal collection called **The Field Shelf**. It is not a generic space wallpaper feed. Its defining behaviour is trustworthy offline access: previously loaded lists and favourites remain available after connectivity disappears and after app restarts; the interface clearly communicates freshness and synchronization state.

## Planned screens

- Launch / animated brand reveal
- Login
- Registration
- Discover / Home
- Discovery Details
- Favourites / The Field Shelf
- Profile & Settings
- Offline, loading, error, empty and first-run states

## Stack (provisional; verify current compatible versions at implementation time)

- React Native, Expo, TypeScript
- Expo Router
- Redux Toolkit + RTK Query
- Expo SQLite for durable content and favourites
- Expo SecureStore for auth tokens
- `@react-native-community/netinfo` for connectivity
- `@expo/vector-icons/Feather` for all interface icons, as required by the brief
- Expo Image for remote image display and cache optimisation
- Expo FileSystem for explicitly saved image files
- React Native Reanimated for the bonus interaction and launch reveal
- React Hook Form + Zod for form validation
- Jest / jest-expo + React Native Testing Library
- ESLint

Do not pin an Expo SDK version from an old proposal. At setup, select the current stable Expo SDK and install native packages with `npx expo install` so versions match that SDK. Check current Expo documentation before implementation.

## APIs

- DummyJSON authentication: `https://dummyjson.com/auth/login`
- DummyJSON simulated user creation: `https://dummyjson.com/users/add`
- NASA APOD replacement endpoint: `https://science.nasa.gov/wp-json/wp/v2/apod-basic/`
- Spaceflight News API v4: `https://api.spaceflightnewsapi.net/v4/articles/`

The legacy `api.nasa.gov/planetary/apod` endpoint is not the chosen dependency. Re-check NASA endpoint availability and response shape before implementation, and keep the NASA adapter isolated so it can be replaced.

## Repository status

This is a project starter pack and design handoff, not a generated working mobile application. The `src/` and `tests/` directories are intentionally starter placeholders. No login, API, database, navigation, offline sync or automated test has yet been implemented.

## Required student ownership

AI tools may help plan, scaffold, review and explain. The student must understand, run, test and own every submitted line. Record actual AI use and corrections in `AI_USAGE.md`; do not invent a correction example before one has happened.
