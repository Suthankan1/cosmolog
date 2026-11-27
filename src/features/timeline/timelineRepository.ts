/**
 * Personal Sky Timeline Repository (F09)
 *
 * Implements an account-scoped SQLite read projection unifying:
 * - Independent field observations (F05)
 * - Saved discoveries / favourites
 * - Article reading history
 * - Sourced study bookmarks
 *
 * Never fabricates event timestamps. Undated items are kept explicit.
 */

import { getDatabase } from '../../database/db';
import {
  TimelineFilter,
  TimelineItem,
  TimelineKind,
  TimelineQueryOptions,
  TimelineQueryResult,
} from './types';

export interface RawTimelineRow {
  kind: TimelineKind;
  source_id: string;
  event_at: string | null;
  date_kind: 'observed' | 'saved' | 'read' | 'undated';
  title: string;
  summary: string | null;
  label: string;
  target_name: string | null;
  conditions: string | null;
  timezone: string | null;
  location_name: string | null;
  source: string | null;
  published_at: string | null;
  note: string | null;
  category: string | null;
  section_anchor: string | null;
  external_id: string | null;
}

export function encodeCursor(cursor: { eventAt: string | null; kind: string; id: string }): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor(token: string): { eventAt: string | null; kind: string; id: string } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.id === 'string' && typeof parsed.kind === 'string') {
      return {
        eventAt: typeof parsed.eventAt === 'string' ? parsed.eventAt : null,
        kind: parsed.kind,
        id: parsed.id,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function mapRowToTimelineItem(row: RawTimelineRow): TimelineItem {
  let routeRef: TimelineItem['routeRef'];

  switch (row.kind) {
    case 'observation':
      routeRef = {
        pathname: '/fieldwork/[id]',
        params: { id: row.source_id },
      };
      break;
    case 'discovery_saved':
    case 'reading_history':
      routeRef = {
        pathname: '/details/[source]/[id]',
        params: {
          source: row.source || 'nasa-apod',
          id: row.external_id || row.source_id,
        },
      };
      break;
    case 'study_bookmark':
      routeRef = {
        pathname: '/study/[id]',
        params: { id: row.source_id },
      };
      break;
  }

  return {
    id: `${row.kind}:${row.source_id}`,
    sourceRecordId: row.source_id,
    kind: row.kind,
    eventAt: row.event_at,
    dateKind: row.date_kind,
    title: row.title,
    summary: row.summary,
    label: row.label,
    routeRef,
    metadata: {
      targetName: row.target_name,
      conditions: row.conditions,
      timezone: row.timezone ?? undefined,
      locationName: row.location_name,
      source: row.source ?? undefined,
      publishedAt: row.published_at,
      note: row.note,
      category: row.category,
      sectionAnchor: row.section_anchor,
    },
  };
}

function buildProjectionQuery(filter: TimelineFilter = 'all'): {
  sql: string;
  hasObservations: boolean;
  hasSaved: boolean;
  hasReading: boolean;
  hasStudy: boolean;
} {
  const parts: string[] = [];
  const hasObservations = filter === 'all' || filter === 'observations';
  const hasSaved = filter === 'all' || filter === 'saved';
  const hasReading = filter === 'all' || filter === 'reading';
  const hasStudy = filter === 'all' || filter === 'study';

  if (hasObservations) {
    parts.push(`
      SELECT 
        'observation' AS kind,
        id AS source_id,
        observed_at AS event_at,
        'observed' AS date_kind,
        title,
        notes AS summary,
        'OBSERVATION' AS label,
        target_name,
        conditions,
        timezone,
        location_name,
        NULL AS source,
        NULL AS published_at,
        NULL AS note,
        NULL AS category,
        NULL AS section_anchor,
        NULL AS external_id
      FROM observations
      WHERE account_id = ?
    `);
  }

  if (hasSaved) {
    parts.push(`
      SELECT
        'discovery_saved' AS kind,
        f.local_id AS source_id,
        f.added_at AS event_at,
        'saved' AS date_kind,
        c.title,
        c.summary,
        'SAVED DISCOVERY' AS label,
        NULL AS target_name,
        NULL AS conditions,
        NULL AS timezone,
        NULL AS location_name,
        c.source,
        c.published_at,
        f.note,
        NULL AS category,
        NULL AS section_anchor,
        c.external_id
      FROM favourites f
      JOIN cached_items c ON c.local_id = f.local_id
      WHERE f.account_id = ?
    `);
  }

  if (hasReading) {
    parts.push(`
      SELECT
        'reading_history' AS kind,
        h.local_id AS source_id,
        h.read_at AS event_at,
        'read' AS date_kind,
        c.title,
        c.summary,
        'ARTICLE READ' AS label,
        NULL AS target_name,
        NULL AS conditions,
        NULL AS timezone,
        NULL AS location_name,
        c.source,
        c.published_at,
        NULL AS note,
        NULL AS category,
        NULL AS section_anchor,
        c.external_id
      FROM reading_history h
      JOIN cached_items c ON c.local_id = h.local_id
      WHERE h.account_id = ?
    `);
  }

  if (hasStudy) {
    parts.push(`
      SELECT
        'study_bookmark' AS kind,
        b.entry_id AS source_id,
        NULL AS event_at,
        'undated' AS date_kind,
        e.title,
        substr(e.body, 1, 160) AS summary,
        'STUDY ENTRY' AS label,
        NULL AS target_name,
        NULL AS conditions,
        NULL AS timezone,
        NULL AS location_name,
        NULL AS source,
        NULL AS published_at,
        b.note,
        e.category,
        b.section_anchor,
        NULL AS external_id
      FROM study_bookmarks b
      JOIN study_entries e ON e.id = b.entry_id
      WHERE b.account = ?
    `);
  }

  return {
    sql: parts.join(' UNION ALL '),
    hasObservations,
    hasSaved,
    hasReading,
    hasStudy,
  };
}

export async function getTimelineItems(
  options: TimelineQueryOptions
): Promise<TimelineQueryResult> {
  const { accountId, filter = 'all', limit = 50, cursor } = options;
  if (!accountId || accountId <= 0) {
    return { items: [], nextCursor: null, totalCount: 0 };
  }

  const { sql: unionSql, hasObservations, hasSaved, hasReading, hasStudy } = buildProjectionQuery(filter);
  if (!unionSql) {
    return { items: [], nextCursor: null, totalCount: 0 };
  }

  const db = await getDatabase();

  // Build params array matching the number of UNION branches
  const branchCount = Number(hasObservations) + Number(hasSaved) + Number(hasReading) + Number(hasStudy);
  const unionParams = Array(branchCount).fill(accountId);

  // Total count query
  const countSql = `SELECT COUNT(*) AS total FROM (${unionSql}) AS timeline_sub`;
  const countRow = await db.getFirstAsync<{ total: number }>(countSql, unionParams);
  const totalCount = countRow?.total ?? 0;

  // Ordering:
  // 1. Dated items before undated (CASE WHEN event_at IS NULL THEN 1 ELSE 0 END ASC)
  // 2. Newer event_at before older (event_at DESC)
  // 3. Stable tie-breaker: kind ASC, source_id ASC
  const orderClause = `
    ORDER BY
      CASE WHEN event_at IS NULL THEN 1 ELSE 0 END ASC,
      event_at DESC,
      kind ASC,
      source_id ASC
  `;

  // Decode cursor if provided
  const decodedCursor = cursor ? decodeCursor(cursor) : null;

  let querySql: string;
  let queryParams: unknown[];

  if (decodedCursor) {
    // When paging with cursor:
    if (decodedCursor.eventAt !== null) {
      // Cursor was in dated records:
      // Rows can be:
      // A) dated with event_at < cursor.eventAt
      // B) dated with event_at == cursor.eventAt AND (kind > cursor.kind OR (kind == cursor.kind AND source_id > cursor.id))
      // C) undated rows (event_at IS NULL)
      querySql = `
        SELECT * FROM (${unionSql}) AS t
        WHERE (
          (t.event_at IS NOT NULL AND (
            t.event_at < ?
            OR (t.event_at = ? AND t.kind > ?)
            OR (t.event_at = ? AND t.kind = ? AND t.source_id > ?)
          ))
          OR t.event_at IS NULL
        )
        ${orderClause}
        LIMIT ?
      `;
      queryParams = [
        ...unionParams,
        decodedCursor.eventAt,
        decodedCursor.eventAt,
        decodedCursor.kind,
        decodedCursor.eventAt,
        decodedCursor.kind,
        decodedCursor.id,
        limit + 1,
      ];
    } else {
      // Cursor was already in undated records:
      // Rows must be undated with (kind > cursor.kind OR (kind == cursor.kind AND source_id > cursor.id))
      querySql = `
        SELECT * FROM (${unionSql}) AS t
        WHERE t.event_at IS NULL AND (
          t.kind > ?
          OR (t.kind = ? AND t.source_id > ?)
        )
        ${orderClause}
        LIMIT ?
      `;
      queryParams = [
        ...unionParams,
        decodedCursor.kind,
        decodedCursor.kind,
        decodedCursor.id,
        limit + 1,
      ];
    }
  } else {
    querySql = `
      SELECT * FROM (${unionSql}) AS t
      ${orderClause}
      LIMIT ?
    `;
    queryParams = [...unionParams, limit + 1];
  }

  const rows = await db.getAllAsync<RawTimelineRow>(querySql, queryParams as never[]);

  let nextCursor: string | null = null;
  let itemsToReturn = rows;

  if (rows.length > limit) {
    itemsToReturn = rows.slice(0, limit);
    const lastItem = itemsToReturn[itemsToReturn.length - 1];
    nextCursor = encodeCursor({
      eventAt: lastItem.event_at,
      kind: lastItem.kind,
      id: lastItem.source_id,
    });
  }

  const items = itemsToReturn.map(mapRowToTimelineItem);

  return {
    items,
    nextCursor,
    totalCount,
  };
}
