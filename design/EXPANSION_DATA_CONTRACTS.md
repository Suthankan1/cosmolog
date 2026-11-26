# Expansion data contracts and migration plan (proposed)

Baseline schema version 14 as observed in src/database/schema.ts and db.ts; verify HEAD before each migration. Do not reserve/skip versions or rewrite shipped migrations. SQLite is durable truth; Redux carries UI/transient state. All identifiers are namespaced and validated; time is UTC ISO with separate original IANA zone or explicit date precision.

## Retention and migration

Keep cached_items, feed_membership, sync_metadata, favourites(account_id,local_id), saved_media, reading_history, reading_checkpoint, shelf_collections, reading_pack_items, offline_item_owners, study entries/bookmarks/progress, study packs and archive search intact. Use the existing writer queue and foreign keys. Before a new schema version, add real SQLite upgrade tests for v14 and all intervening versions, empty install, failure rollback, account isolation, protected data and existing legacy import; update db.ts maximum supported version only in same migration slice. Do not clear/recreate user DB on failure. Older binaries may refuse a newer schema: do not promise downgrade safety; plan forward fix and user-data preserving recovery.

## Proposed entities (not SQL to run)

| Entity | Identity / fields | Constraints |
|---|---|---|
| ExpeditionManifest | id, revision, title, description, steps[], sources[], estimatedBytes | stable ID, positive integer revision, capped size/count, typed step refs, unique steps; no arbitrary URL execution |
| ExpeditionStep | id, kind (discovery/study/prompt), targetId?, order, sourceRef?, required | valid existing target ID or reviewed bundled content; order deterministic |
| ExpeditionProgress | accountId, expeditionId, stepId, completedAt, revision | positive verified account; preserve compatible completed step IDs on update; explicit status for removed/changed steps |
| OfflineStorageView | type, itemId, bytes, availability, ownershipReason, removable | read projection; verify file existence and physical-byte dedup; account privacy |
| ScienceDatum | id, quantity, value, unit, referenceFrame, precision, sourceIds[], revision | finite nonnegative values; units explicit; approximate distance/diameter distinguished; nullable unknown |
| Observation | accountId, id, title, note, observedAt, timezone, createdAt, updatedAt, targetId?, condition?, coordinates?, headingSnapshot? | UUID/opaque stable id; title/note bounded (proposed 120/4000 chars), valid time, signed lat [-90,90], lon [-180,180]; no automatic coordinates |
| ObservationAttachment | accountId, observationId, id, relativePath, mime, bytes, createdAt | composite parent FK, app-private path, bounded bytes, validated image; no public URL |
| ObservationLink | accountId, observationId, kind, targetId | one unique relationship per target; stable source/id, validated study/sky/event id; no cascade delete of shared records |
| InstrumentSnapshot | capturedAt, azimuthDeg?, inclinationDeg?, reference (magnetic/true/unknown), quality, source, targetId? | normalized ranges, nullable unavailable values, no misleading confidence; immutable captured value |
| EvidenceDossier | id, revision, headline, observation, method, inference, uncertainty, sourceRefs[], relatedIds[] | structured text, rights metadata, dated review; no unsupported generated claims |
| CultureOverlay | id, revision, tradition, region, historicalContext, projectionEpoch, stars[], segments[], sourceRefs[], licenses[] | explicit culture attribution, all segment endpoints exist; no unknown asset rights |
| TimelineItem | kind, id, eventAt?, dateKind, label, routeRef | read-only projection, account filter, cursor includes time/kind/id; undated separately |
| MeteorEvent | id, editionYear, name, activeStart/End, peakUTC?, peakDate?, precision, radiant?, zhr?, sourceRef | source-reviewed annual dates, unknowns nullable; UTC precision respected; rate not local guarantee |
| ReaderPreference | accountId, theme (editorial/night), speechRate?, voiceId? | safe defaults, voice availability checked on device; no recording/transcript storage |
| SourceRef | id, url, publisher, title, accessedAt, edition/revision?, license?, credit?, notes | HTTPS origin, per-record provenance and rights; separate data/code/art licensing |

If study/pack sources already model a field, extend them rather than duplicating. Design the smallest needed tables per release. Possible new tables: expedition_progress, observations, observation_attachments, observation_links, reader_preferences. Public datasets should remain versioned bundled JSON where feasible. Timeline is a projection, not a duplicated personal-event log. Existing user-owned image policy covers sourced media; observation photos have separate ownership and retention rules.

## Proposed content files

- src/features/labs/data/scale-v1.json (validated source records and units; derive math at runtime)
- src/features/study/content/evidence-v1.json (or extend the existing edition format)
- src/features/sky/catalog/cultures/manifest.json and individual licensed extracts
- src/features/events/data/meteors-YYYY.json (edition/review/validity)
- Existing study-releases manifest/parts for optional large reviewed supplements; publish only after content and license review.

The [reference data seeds](../docs/expansion/reference-data-seeds.json) are documentation/test candidate inputs only; not live APIs, not an importable production manifest. Never fill missing sources with invented rows.

## Failure handling

Manifest schema invalid, digest mismatch, duplicate/unknown ID, insufficient disk or path traversal: reject without changing installed revision. Network interrupted: retain committed content and truthful readiness; retry missing units. Invalid science numeric data: show unavailable, never NaN/infinite. Missing photo: preserve note and explain missing attachment. Missing permission/sensor/voice: provide manual or text fallback; no infinite retry. Sign-out during async work: cancel and reject stale private writes. Storage clearing: preflight impact, preserve source memberships and all owner relationships; files only removed after no retaining owner remains. Record and test each boundary.
