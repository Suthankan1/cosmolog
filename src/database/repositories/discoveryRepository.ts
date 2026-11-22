import { getDatabase } from '../db';
import { CachedItemRow, DiscoveryItem, mapRowToDiscoveryItem } from '../models';
import { DiscoverySource } from '../../navigation/types';

/**
 * Upserts an array of normalized DiscoveryItems into SQLite.
 * Uses parameterized queries and runs inside a transaction.
 * Preserves previously downloaded image_local_uri so refresh doesn't purge offline assets.
 */
export async function upsertDiscoveryItems(items: DiscoveryItem[]): Promise<void> {
  if (items.length === 0) return;

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO cached_items (
          local_id, source, external_id, title, summary, body,
          published_at, image_remote_url, image_local_uri, canonical_url,
          attribution, author, media_type, fetched_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(local_id) DO UPDATE SET
          title = excluded.title,
          summary = excluded.summary,
          body = excluded.body,
          published_at = excluded.published_at,
          image_remote_url = excluded.image_remote_url,
          canonical_url = excluded.canonical_url,
          attribution = excluded.attribution,
          author = excluded.author,
          media_type = excluded.media_type,
          updated_at = excluded.updated_at;`,
        [
          item.localId,
          item.source,
          item.externalId,
          item.title,
          item.summary,
          item.body,
          item.publishedAt,
          item.imageRemoteUrl,
          item.imageLocalUri,
          item.canonicalUrl,
          item.attribution,
          item.author,
          item.mediaType,
          item.fetchedAt,
          item.updatedAt,
        ]
      );
    }
  });
}

/**
 * Reads cached feed items from SQLite ordered by published_at DESC.
 */
export async function getCachedFeed(source?: DiscoverySource): Promise<DiscoveryItem[]> {
  const db = await getDatabase();
  let query = 'SELECT * FROM cached_items ORDER BY published_at DESC, fetched_at DESC';
  const params: string[] = [];

  if (source) {
    query = 'SELECT * FROM cached_items WHERE source = ? ORDER BY published_at DESC, fetched_at DESC';
    params.push(source);
  }

  const rows = await db.getAllAsync<CachedItemRow>(query, params);
  return rows.map(mapRowToDiscoveryItem);
}

/**
 * Retrieves a single discovery item by localId (source:externalId).
 */
export async function getDiscoveryItemById(localId: string): Promise<DiscoveryItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CachedItemRow>(
    'SELECT * FROM cached_items WHERE local_id = ?',
    [localId]
  );

  return row ? mapRowToDiscoveryItem(row) : null;
}

/**
 * Updates the local persistent filesystem URI for a discovery item.
 */
export async function updateLocalImageUri(localId: string, localUri: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE cached_items SET image_local_uri = ? WHERE local_id = ?',
    [localUri, localId]
  );
}
