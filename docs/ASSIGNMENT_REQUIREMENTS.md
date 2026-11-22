# IN3210 Assignment 2 — Requirements traceability

Source: `source_materials/IN3210_Assignment_2_React_Native.pdf` (3 pages). The assignment brief is authoritative.

## Index calculation
Numeric index: 234202.
- Last digit 2 => Space & Science.
- Second-last digit 0 => Offline-first.

## Domain and twist
The brief's example Space & Science APIs are Spaceflight News API and NASA APOD. The app may use another free API in the same domain if justified in README.

Offline-first required behaviour:
- Last loaded list and all favourites available without internet.
- Offline banner appears while offline.
- Data refreshes when connection returns.

## Core requirements
1. Authentication: registration and login with validation; show user's name after login; DummyJSON; token in OS-backed secure storage; logout clears session. Registration may be simulated with `POST /users/add`, then redirect to login.
2. Navigation: separate auth flow; bottom tabs including Home and Favourites; Home → Details stack; typed route params.
3. Home: API items as cards with image/icon, title, description/status; loading, error with retry, and empty states.
4. Details: receives item ID, not full object; loads its own data; favourite toggle.
5. State management: Redux Toolkit with RTK Query, thunks or Redux-Saga for async logic; explain choice in README.
6. Favourites: add/remove from list and Details; Favourites tab; persistence across restarts.
7. Styling: consistent theme tokens; Feather icons for all icons; responsive layouts; minimum 44 pt / 48 dp touch targets.
8. Quality: TypeScript throughout; feature-based structure; ESLint no errors; at least three meaningful tests using Jest and/or Maestro.

## Bonus (choose one)
- Persistent dark-mode toggle; OR
- smooth Reanimated interaction; OR
- component tests with React Native Testing Library in addition to the three required tests.

Selected bonus: Reanimated save/favourite interaction, because it reinforces the brand and avoids introducing a separate theme system late in the schedule. Reassess only if implementation risk is high.

## AI use requirements
- `AI_USAGE.md` must document use and at least one actual case where AI output was corrected/changed and why.
- README must have a Key decisions section explaining at least three decisions in the student's own words.

## Code quality and process
- Decoupled/testable/reusable code; keep API calls, state and UI separate.
- Proper validation and clear errors.
- Feature-based commits; a single whole-app commit loses marks.

## Deliverables
- Public GitHub repository.
- README with setup, screenshots (Login, Home, Details, Favourites, twist), architecture, state choice and Key decisions.
- AI_USAGE.md.
- Narrated demo ≤3 minutes:
  - ~1 min app flow: login → list → details → favourite → restart → favourites persist → twist.
  - ~2 min code walkthrough: explain technologies/libraries and where used, including twist.
- Optional release APK attached to GitHub release.

## Marking scheme
| Area | Marks |
|---|---:|
| Authentication & validation incl. secure token storage | 15 |
| Navigation incl. auth flow and typed params | 10 |
| API integration & data display incl. loading/error/empty | 15 |
| State management & persistence | 15 |
| Twist feature | 10 |
| UI/UX & responsiveness | 10 |
| Code quality & best practices incl. TypeScript, structure, lint, tests | 15 |
| Git history, README & Key decisions | 5 |
| Demo video | 5 |
| Total | 100 |
| Bonus | +5 |

## Implementation acceptance criteria
- [ ] Auth token stored only in SecureStore.
- [ ] Login and simulated registration validated.
- [ ] Auth and main navigation separated; route params typed.
- [ ] Details fetches by source + ID.
- [ ] SQLite renders previously cached content before remote refresh.
- [ ] Offline banner and accurate last sync timestamp.
- [ ] Favourites and cached list survive app restart and airplane mode.
- [ ] Reconnection refresh does not duplicate items or erase favourites.
- [ ] API response validation and normalization.
- [ ] Loading/error/empty/first-run-offline states.
- [ ] At least 3 meaningful tests; target 5+.
- [ ] ESLint passes.
- [ ] Screenshots, README, AI_USAGE.md, demo.
