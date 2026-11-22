# IN3210 lecture coverage matrix

This matrix distinguishes lecture-supported concepts from implementation choices. The six supplied lecture PDFs are included under `source_materials/`. They are not assumed to cover every item in the full course outline.

| Lecture/source area | COSMOLOG application |
|---|---|
| Lesson 1: mobile app characteristics | small-screen hierarchy, touch input, personalization, performance, portability, resource/battery/network management, privacy/security, context awareness and update strategy |
| Lesson 1: framework history | rationale for modern React Native/Expo rather than legacy WebView wrapper; distinguish native and cross-platform models |
| Intro to UI/UX: design thinking | empathize/define/ideate/prototype/test; PACT analysis |
| Intro to UI/UX: PACT | people, activities, contexts and technologies mapped in PROJECT_CONTEXT.md |
| Lesson 2: UI vs UX | visual design and task experience specified separately |
| Lesson 2: principles | clarity, consistency, feedback, simplicity, affordance |
| Lesson 2: layouts | card/list/hybrid editorial feed |
| Lesson 2: evaluation | heuristic evaluation, perspective-based testing, cognitive walkthrough, pluralistic walkthrough, formal usability inspection |
| Lesson 3: application models | cross-platform choice justified against audience, complexity, hardware, skills, cost and timeline |
| Lesson 4: sensors | optional magnetometer only if a real feature justifies it; correct permission and calibration considerations |
| Security lecture: CIA | confidentiality of tokens, integrity of validated records/SQL, availability through offline cache |
| Security lecture: OWASP Mobile Top 10 | credential use, supply chain, auth, validation, communication, privacy, binary/config, storage, cryptography |
| Security lecture: threats | TLS validation, safe rendering, parameterized SQL, secure session, minimal permissions |
| Security lecture: review workflow | map, inspect, test, verify, report |
| Accessibility/usability | contrast, dynamic type, screen readers, touch targets, reduced motion and task-based usability testing |

## Scope qualifications
- The lecture set includes Lesson 1, Intro to UI/UX, Lesson 2 UI design, Lesson 3 application models, Lesson 4 sensors and Mobile Application Security.
- Some topics in the Lesson 1 course-content slide (Android framework internals, cloud integration, networking/OS/hardware integration, privacy/ethics and testing methodologies) are not fully covered by the six PDFs. The project can demonstrate related engineering practices, but do not claim the slides teach material they do not contain.
- Current platform practices may refine lecture examples. Preserve what the lecturer states when explaining lecture content; clearly label additional technical interpretation.
