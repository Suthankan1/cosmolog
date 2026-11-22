import { getDatabase } from '../db';

export interface SyncMetadataRecord {
  feedKey: string;
  lastSyncedAt: string | null;
  lastAttemptAt: string | null;
  lastErrorCode: string | null;
}

interface SyncMetadataRow {
  feed_key: string;
  last_synced_at: string | null;
  last_attempt_at: string | null;
  last_error_code: string | null;
}

/**
 * Updates the last successful sync timestamp in SQLite.
 * Per assignment rules: never fabricate timestamps; persist only after DB transaction commits.
 */
export async function setLastSuccessfulSync(
  feedKey: string,
  timestamp: string = new Date().toISOString()
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_metadata (feed_key, last_synced_at, last_attempt_at, last_error_code)
     VALUES (?, ?, ?, NULL)
     ON CONFLICT(feed_key) DO UPDATE SET
       last_synced_at = excluded.last_synced_at,
       last_attempt_at = excluded.last_attempt_at,
       last_error_code = NULL;`,
    [feedKey, timestamp, timestamp]
  );
}

/**
 * Records an attempt (successful or failed) for diagnostic and freshness display.
 */
export async function recordSyncAttempt(
  feedKey: string,
  errorCode?: string
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sync_metadata (feed_key, last_attempt_at, last_error_code)
     VALUES (?, ?, ?)
     ON CONFLICT(feed_key) DO UPDATE SET
       last_attempt_at = excluded.last_attempt_at,
       last_error_code = excluded.last_error_code;`,
    [feedKey, now, errorCode || null]
  );
}

/**
 * Gets the last confirmed sync timestamp for a feed.
 */
export async function getLastSuccessfulSync(feedKey: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ last_synced_at: string | null }>(
    'SELECT last_synced_at FROM sync_metadata WHERE feed_key = ?',
    [feedKey]
  );
  return row?.last_synced_at || null;
}

/**
 * Gets complete sync metadata for a feed.
 */
export async function getSyncMetadata(feedKey: string): Promise<SyncMetadataRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SyncMetadataRow>(
    'SELECT * FROM sync_metadata WHERE feed_key = ?',
    [feedKey]
  );

  if (!row) return null;

  return {
    feedKey: row.feed_key,
    lastSyncedAt: row.last_synced_at,
    lastAttemptAt: row.last_attempt_at,
    lastErrorCode: row.last_error_code,
  };
}
