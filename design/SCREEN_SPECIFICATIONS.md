# COSMOLOG v2 — Screen specifications

[Figma file](https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N?node-id=11-5). V2 primary screens and five distinct offline/error states are editable in Figma.

The production mastheads use NASA Earthrise. The Figma screens use illustrative example articles, profiles, counts and sync times. Production content must be populated from actual APIs/local database and must not present samples as live data.

## Primary screens (7)
| Screen | Figma Node | Requirements |
|---|---|---|
| Launch Reveal | `16:2` | In-app brand reveal: dark forest + crescent/orbit/wordmark + moon horizon. Native splash icon remains static; reduced-motion alternative |
| Login | `16:25` | Username/password labels, validation, password reveal, DummyJSON login, SecureStore session, loading and error states |
| Create Account | `16:70` | Simulated DummyJSON registration, inline disclosure, no fake persistent user |
| Discover | `17:42` | Curated NASA image, space dispatch list, local search, offline banner, article cards, loading/retry/empty states, last refresh |
| Article Details | `17:136` | Route by source+ID, own data loading, hero image, full explanation, favourite toggle, provenance/original link and a private field note for saved discoveries |
| Favourites | `18:109` | Four sample saved entries as editable design; actual rows from durable SQLite, image status, note search, filters, sorting, add/remove, empty state |
| Profile & Settings | `18:191` | Local storage stats, last-sync info, preferences, attribution, logout; no fictional cross-device syncing |

## Archive extensions

The Field Shelf opens protected Reading history and Collections screens. Collection membership editing uses a keyboard-safe compose view. Discover opens a protected Reading packs screen showing each plate's text and image availability. On This Day uses the existing Details route. Share discovery opens the device share sheet from Details.

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
