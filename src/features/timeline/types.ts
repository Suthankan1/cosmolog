/**
 * Personal Sky Timeline Data Types (F09)
 *
 * Sourced read-only projection contract integrating observations,
 * saved discoveries, reading checkpoints/history, and study bookmarks.
 */

export type TimelineKind =
  | 'observation'
  | 'discovery_saved'
  | 'reading_history'
  | 'study_bookmark';

export type TimelineDateKind = 'observed' | 'saved' | 'read' | 'undated';

export type TimelineFilter =
  | 'all'
  | 'observations'
  | 'saved'
  | 'reading'
  | 'study';

export interface TimelineItemMetadata {
  /** Target astronomical body / object (observations) */
  targetName?: string | null;
  /** Viewing conditions / Bortle index (observations) */
  conditions?: string | null;
  /** Original IANA timezone of the record */
  timezone?: string;
  /** Celestial instrument coordinates / location name */
  locationName?: string | null;
  /** Discovery source provider ('nasa-apod' | 'spaceflight-news') */
  source?: string;
  /** Original publisher release date (differentiated from user save/read date) */
  publishedAt?: string | null;
  /** Personal field note or bookmark annotation */
  note?: string | null;
  /** Space study category */
  category?: string | null;
  /** Anchor within study entry */
  sectionAnchor?: string | null;
}

export interface TimelineItem {
  /** Stable composite identifier `${kind}:${sourceRecordId}` */
  id: string;
  /** Underlying primary key in the source table */
  sourceRecordId: string;
  kind: TimelineKind;
  /** UTC ISO timestamp, or null if record has no reliable event timestamp */
  eventAt: string | null;
  /** Explicit date kind to prevent implying fabricated event timestamps */
  dateKind: TimelineDateKind;
  title: string;
  summary: string | null;
  /** Visual badge label */
  label: string;
  /** Typed route reference for in-app navigation */
  routeRef: {
    pathname: string;
    params?: Record<string, string>;
  };
  metadata?: TimelineItemMetadata;
}

export interface TimelineGroup {
  key: string;
  title: string;
  items: TimelineItem[];
}

export interface TimelineQueryOptions {
  accountId: number;
  filter?: TimelineFilter;
  /** Number of items to return (default 50) */
  limit?: number;
  /** Opaque cursor token for stable pagination */
  cursor?: string | null;
}

export interface TimelineQueryResult {
  items: TimelineItem[];
  nextCursor: string | null;
  totalCount: number;
}
