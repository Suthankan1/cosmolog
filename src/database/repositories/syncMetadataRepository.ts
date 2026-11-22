import { getDatabase, writeDatabase } from '../db';
import type { DiscoverySource } from '../../navigation/types';

export const LEGACY_FEED_KEY = 'discovery_feed';

export interface SyncMetadata {
  lastSyncedAt: string | null;
  lastAttemptAt: string | null;
  error: string | null;
}

export async function getSyncMetadata(source: DiscoverySource | typeof LEGACY_FEED_KEY): Promise<SyncMetadata> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    last_synced_at: string | null; last_attempt_at: string | null; last_error_code: string | null;
  }>('SELECT * FROM sync_metadata WHERE feed_key = ?', [source]);
  return {
    lastSyncedAt: row?.last_synced_at ?? null,
    lastAttemptAt: row?.last_attempt_at ?? null,
    error: row?.last_error_code ?? null,
  };
}

export async function recordSyncFailure(source: DiscoverySource, error: string): Promise<void> {
  await writeDatabase(async db => {
    await db.runAsync(
      `INSERT INTO sync_metadata (feed_key, last_attempt_at, last_error_code) VALUES (?, ?, ?)
       ON CONFLICT(feed_key) DO UPDATE SET
         last_attempt_at = excluded.last_attempt_at, last_error_code = excluded.last_error_code`,
      [source, new Date().toISOString(), error],
    );
  });
}
