import { getDatabase } from '../db';
import { CachedItemRow, DiscoveryItem, mapRowToDiscoveryItem } from '../models';

export interface FavouriteDiscoveryItem extends DiscoveryItem {
  addedAt: string;
}

interface FavouriteRow extends CachedItemRow {
  added_at: string;
}

/**
 * Adds an item to favourites in durable SQLite.
 */
export async function addFavourite(localId: string): Promise<void> {
  const db = await getDatabase();
  const addedAt = new Date().toISOString();
  await db.runAsync(
    'INSERT OR IGNORE INTO favourites (local_id, added_at) VALUES (?, ?)',
    [localId, addedAt]
  );
}

/**
 * Removes an item from favourites in durable SQLite.
 */
export async function removeFavourite(localId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM favourites WHERE local_id = ?', [localId]);
}

/**
 * Checks whether an item is currently in favourites.
 */
export async function isFavourite(localId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favourites WHERE local_id = ?',
    [localId]
  );
  return Boolean(row && row.count > 0);
}

/**
 * Retrieves all favourite items joined with their cached item details.
 */
export async function getFavourites(): Promise<FavouriteDiscoveryItem[]> {
  const db = await getDatabase();
  const query = `
    SELECT c.*, f.added_at
    FROM favourites f
    INNER JOIN cached_items c ON f.local_id = c.local_id
    ORDER BY f.added_at DESC;
  `;

  const rows = await db.getAllAsync<FavouriteRow>(query);
  return rows.map((row) => ({
    ...mapRowToDiscoveryItem(row),
    addedAt: row.added_at,
  }));
}

/**
 * Retrieves list of all favourited local IDs.
 */
export async function getFavouriteLocalIds(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ local_id: string }>(
    'SELECT local_id FROM favourites ORDER BY added_at DESC'
  );
  return rows.map((r) => r.local_id);
}
