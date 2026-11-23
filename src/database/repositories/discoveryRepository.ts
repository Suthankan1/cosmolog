import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase, writeDatabase } from '../db';
import { CachedItemRow, DiscoveryItem, mapRowToDiscoveryItem } from '../models';
import { DiscoverySource } from '../../navigation/types';

export async function upsertItem(db: SQLiteDatabase, item: DiscoveryItem) {
  await db.runAsync(
    `INSERT INTO cached_items (
       local_id, source, external_id, title, summary, body, published_at,
       image_remote_url, image_license_url, canonical_url, attribution, author, media_type, fetched_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(local_id) DO UPDATE SET
       title = excluded.title, summary = excluded.summary, body = excluded.body,
       published_at = excluded.published_at, image_remote_url = excluded.image_remote_url,
       image_license_url = excluded.image_license_url,
       canonical_url = excluded.canonical_url, attribution = excluded.attribution,
       author = excluded.author, media_type = excluded.media_type,
       fetched_at = excluded.fetched_at, updated_at = excluded.updated_at`,
    [
      item.localId, item.source, item.externalId, item.title, item.summary, item.body,
      item.publishedAt, item.imageRemoteUrl, item.imageLicenseUrl ?? null, item.canonicalUrl, item.attribution,
      item.author, item.mediaType, item.fetchedAt, item.updatedAt,
    ],
  );
}

export async function upsertDiscoveryItems(items: DiscoveryItem[]): Promise<void> {
  await writeDatabase(async db => {
    for (const item of items) await upsertItem(db, item);
  });
}

/** The list and timestamp become visible together, including a successful empty list. */
export async function commitFeedSnapshot(source: DiscoverySource, items: DiscoveryItem[], time: string) {
  const entries = [...new Map(items.map(item => [item.localId, item])).values()];
  await writeDatabase(async db => {
    await db.runAsync('DELETE FROM feed_membership WHERE source = ?', [source]);
    for (const [position, item] of entries.entries()) {
      if (item.source !== source) throw new Error('Item source does not match feed');
      await upsertItem(db, item);
      await db.runAsync('INSERT INTO feed_membership VALUES (?, ?, ?)', [source, item.localId, position]);
    }
    await db.runAsync(
      `INSERT INTO sync_metadata VALUES (?, ?, ?, NULL)
       ON CONFLICT(feed_key) DO UPDATE SET last_synced_at = excluded.last_synced_at,
       last_attempt_at = excluded.last_attempt_at, last_error_code = NULL`,
      [source, time, time],
    );
    const cutoff = new Date(new Date(time).getTime() - 30 * 86400_000).toISOString();
    await db.runAsync(
      `DELETE FROM cached_items WHERE fetched_at < ?
       AND NOT EXISTS (SELECT 1 FROM feed_membership WHERE local_id = cached_items.local_id)
       AND NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = cached_items.local_id)
       AND NOT EXISTS (SELECT 1 FROM saved_media WHERE local_id = cached_items.local_id)
       AND NOT EXISTS (SELECT 1 FROM reading_checkpoint WHERE local_id = cached_items.local_id)
       AND NOT EXISTS (SELECT 1 FROM reading_history WHERE local_id = cached_items.local_id)`,
      [cutoff],
    );
  });
}

export async function getCachedFeed(source?: DiscoverySource): Promise<DiscoveryItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CachedItemRow>(
    `SELECT c.* FROM feed_membership f
     JOIN cached_items c ON c.local_id = f.local_id
     WHERE (? IS NULL OR f.source = ?) ORDER BY f.source, f.position, c.local_id`, [source ?? null, source ?? null],
  );
  return rows.map(mapRowToDiscoveryItem);
}

export async function getDiscoveryItemById(localId: string): Promise<DiscoveryItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CachedItemRow>('SELECT * FROM cached_items WHERE local_id = ?', [localId]);
  return row ? mapRowToDiscoveryItem(row) : null;
}

export async function findCachedPlateAnniversary(today: string): Promise<DiscoveryItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CachedItemRow>(
    `SELECT * FROM cached_items WHERE source = 'nasa-apod' AND external_id < ?
     AND substr(external_id, 6) = ? ORDER BY external_id DESC LIMIT 1`,
    [today, today.slice(5)],
  );
  return row ? mapRowToDiscoveryItem(row) : null;
}
