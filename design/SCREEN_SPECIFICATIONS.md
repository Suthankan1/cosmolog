# COSMOLOG — Magazine screen specifications

[Figma file](https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N?node-id=11-5). V2 screens and offline/error examples are retained there as historical references. Current layouts follow the magazine boards and production app.

The launch uses NASA’s Apollo 17 Blue Marble. The sign-in masthead uses NASA Earthrise. The Figma screens use illustrative example articles, profiles, counts and sync times. Production content must be populated from actual APIs/local database and must not present samples as live data.

## Primary screens (7)
| Screen | Figma Node | Requirements |
|---|---|---|
| Launch Reveal | `16:2` | In-app brand reveal: dark forest + cut C, outlined wordmark and transparent Apollo 17 globe. Native splash icon remains static; reduced-motion alternative |
| Login | `16:25` | Username/password labels, validation, password reveal, DummyJSON login, SecureStore session, loading and error states |
| Create Account | `16:70` | Simulated DummyJSON registration, inline disclosure, no fake persistent user |
| Discover | `17:42` | Curated NASA image, space dispatch list, local search, offline banner, article cards, loading/retry/empty states, last refresh |
| Article Details | `17:136` | Route by source+ID, own data loading, hero image, full explanation, favourite toggle, provenance/original link and a private field note for saved discoveries |
| Favourites | `18:109` | Four sample saved entries as editable design; actual rows from durable SQLite, image status, note search, filters, sorting, add/remove, empty state |
| Profile & Settings | `18:191` | Local storage stats, last-sync info, preferences, attribution, logout; no fictional cross-device syncing |

## Archive extensions

The Field Shelf opens protected Reading history and Collections screens. Collection membership editing uses a keyboard-safe compose view. Discover opens a protected Reading packs screen showing each plate's text and image availability. On This Day uses the existing Details route. Share discovery opens the device share sheet from Details.

Discover opens the protected Sky Viewer. Use a forest chart with ivory markers, brass accents, and a horizon line. The manual arrows and object list provide alternatives to phone pointing and chart taps. An ivory detail sheet shows the selected object's catalog information and links. The viewer displays the active location source and the availability of cached satellite predictions.

## States (5 additional screens)
| State | Figma Node | Expected behavior |
|---|---|---|
| Offline with cached collection | `19:2` | Cached items and favourites remain usable, last successful sync date |
| First-launch offline / no cache | `19:64` | Honest empty-cache explanation and reconnection retry |
| Reconnecting / refreshing | `19:108` | Cached content stays while remote data refreshes |
| API error with retry | `19:153` | Explicit failed request without erasing saved content |
| Empty Field Shelf | `19:197` | Clear save/discovery explanation and useful CTA |

## Screen acceptance
- No emoji icons. Feather-outline vectors in Figma, Feather library in implementation.
- Tab structure: Discover / Favourites / Profile; no duplicate 'Saved' tab.
- User actions should have real implementation, or be removed before submission. The mockup bell is a *design affordance* pending review; do not ship a dead notification action.
- Sample dates, read times, counts and article titles are not claims of real events.
- Offline banner visible only in appropriate state; it is not permanently shown.
- Source and image attribution available in detail.
- Long-form Details scrolls; save CTA should not overlap dynamic content.
- Authentication feedback, focus order, keyboard avoidance, screen readers and larger text are tested on-device.

## Space Study

Discover opens the ivory Field Guide with its table of contents and object atlas. The reader displays one section at a time, sources, related entries and a chapter glossary. The Field Shelf opens account-owned study bookmarks and notes. Editions and downloads shows catalog coverage, pack sizes and installation status. My sky supports locally indexed city names, manual coordinates and optional foreground GPS. A linked target reports a direction or an unavailable-position state, including when it lies below the horizon.

## Platform controls

Discover, Favourites and Profile use the floating three-tab capsule. The router reports its measured height to each list so the final action scrolls clear. Discover groups Space Study, Sky Viewer, packs and date browsing under **Study, sky and archives**. Favourites groups saved study entries, Collections and History under **Shelf tools**. The manual sky toolbar sits below the chart so all chart targets stay visible.


## Magazine layouts

Discover keeps its outlined masthead, search and edition selector above the cover. All sources leads with the newest plate when available, then shows the remaining interleaved stories. Each single-source edition leads with its newest record. Empty editions and unavailable media have explicit states. The 264-point dock expands at larger type sizes.

Details opens with source, date, headline, byline and save action before the image. The Shelf puts search and saved entries before archive tools. Profile groups identity, local storage, refresh and sign-out. The Field Guide uses ruled chapter headings, catalogue labels and persistent section positions. Reading packs and edition downloads use ruled panels. Sky Viewer leads with the chart and manual controls.
