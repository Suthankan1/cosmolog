# Expansion UX — proposed magazine-native screen map

Current production magazine handoff (design/magazine) and implemented screens are authoritative, not archived Figma. These are screen specifications, not newly created Figma frames. Keep current three-tab floating dock first; hubs are protected routes, and a five-tab proposal must pass usability review before implementation.

| Surface | Entry | Layout and primary action | Offline/error/empty |
|---|---|---|---|
| Explore hub | Discover: Study, sky and archives | Ruled magazine sections: Expeditions, Labs, Evidence, Sky Cultures | Show bundled content available, download-needed clearly |
| Expedition library/detail | Explore or Shelf | Editorial cover, intro, ordered itinerary, actual readiness/size, download/resume | Partial steps visible, retry/cancel, text-only/rights, storage failure, remove preview |
| Offline Library | Shelf tools / Profile storage | Summary + expandable categories and byte totals, item status/why retained | No cache, shared ownership, missing file, eligible clear |
| LightTrace | Explore / supported object detail | Serif headline, logarithmic ruler, selector, duration, source/assumptions | All bundled; unavailable distance reason, accessible text result |
| Cosmic Scale | Explore / related Study | Segmented size/distance/travel modes, comparison controls, scale legend | All bundled; invalid speed/unknown quantity explanation |
| Fieldwork hub | Discover or Shelf tools | Observation CTA, journal list, instrument, timeline/calendar | Offline-first; no sensor required to enter |
| Field Notes | Fieldwork / Sky Viewer | Dated list, editor with target/conditions/time and optional photo/location, save | Permission denial, missing photo, empty journal, durable edit |
| Field Instrument | Fieldwork / observation editor | Forest dial, ivory numbers, compass reference/tilt/sample, capture button | Calibration, interference, unavailable, manual fallback; no background sensing |
| Evidence dossier | Study / Explore | Four ruled blocks: observation, method, inference, uncertainty; source | Bundled or installed edition; unavailable source link clear |
| Sky Cultures | Explore / Sky Viewer | Same stars + toggle two sourced traditions, text alternative, attribution | Works offline, missing star/rights content omitted |
| Timeline | Fieldwork / Shelf | Date groups and filters, stable chronological rows, link underlying item | Empty, missing/undated source, local date and kind |
| Meteor Calendar | Fieldwork | Annual edition, active/peak estimates, local time when known, source | Expired data warning; unknown time and visibility caveats |
| Read Aloud | Details/Study reader | Speaker play/stop and rate with accessible state | Voice unavailable, silent mode, no network voice; text always accessible |
| Night mode | Profile / Fieldwork | Explicit toggle and quick exit; charcoal/red semantic palette | Persist preference, explain system dialogs may differ |

Shared standards: typography and editorial color roles match current production tokens; natural spacing, Feather icons, 48dp/44pt targets, safe areas, text scaling and readable focus order. No fake buttons or sample counts as live. Graphs/dials have numeric/text equivalents and non-gesture inputs. No permission prompt before a clear user action. Motion obeys system reduced motion. Use real attributed image content only when permitted. Do not claim new Figma designs exist.

## Example connected path
Daily Plate → Explore expedition → ordered offline learning steps → LightTrace/Scale → read evidence → open Field Instrument / record observation → Timeline → Shelf offline. Add another route only when needed; maintain back navigation and avoid duplicate content storage.

## Usability validation
Cognitive walkthrough of download/retry, airplane-mode restart, capture permission denial and note edit, calendar source date and accessible narration. Ask representative users to find these tasks and record task completion/errors/time/feedback (do not invent participants). Confirm large text, screen readers, contrast, and manual controls in real device builds. Keep existing Discover and Favourites visible for assignment.
