import { getDatabase, writeDatabase } from '../db';
import { CachedItemRow, DiscoveryItem, mapRowToDiscoveryItem } from '../models';
import { mayDownloadImage } from '../../services/api/mediaPolicy';
import { mapSavedMedia, type MediaStatus, type SavedMediaRow } from './mediaRepository';
export const NOTE_LIMIT = 1000;

export interface FavouriteDiscoveryItem extends DiscoveryItem {
  addedAt: string;
  note: string | null;
  readAt: string | null;
  mediaStatus: MediaStatus;
  imageBytes: number;
}

interface FavouriteRow extends CachedItemRow, SavedMediaRow {
  added_at: string;
  note: string | null;
  read_at: string | null;
}

export async function setFavourite(accountId: number, localId: string, saved: boolean) {
  await writeDatabase(async db => {
    if (!saved) {
      await db.runAsync('DELETE FROM favourites WHERE account_id = ? AND local_id = ?', [accountId, localId]);
      return;
    }
    const item = await db.getFirstAsync<CachedItemRow>('SELECT * FROM cached_items WHERE local_id = ?', [localId]);
    if (!item) throw new Error('Cannot save a missing record');
    await db.runAsync(
      'INSERT INTO favourites (account_id, local_id, added_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
      [accountId, localId, new Date().toISOString()],
    );
    if (mayDownloadImage(item.source, item.image_remote_url, item.attribution, item.image_license_url)) {
      await db.runAsync(
        "INSERT INTO saved_media (local_id, status) VALUES (?, 'waiting') ON CONFLICT DO NOTHING",
        [localId],
      );
    }
  });
}

export async function getFavourites(accountId: number): Promise<FavouriteDiscoveryItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FavouriteRow>(
    `SELECT c.*, f.added_at, f.note, h.read_at, m.status, m.file_name, m.source_url, m.license_url FROM favourites f
     JOIN cached_items c ON c.local_id = f.local_id
     LEFT JOIN saved_media m ON m.local_id = c.local_id
     LEFT JOIN reading_history h ON h.account_id = f.account_id AND h.local_id = f.local_id
     WHERE f.account_id = ? ORDER BY f.added_at DESC, c.local_id`,
    [accountId],
  );
  return rows.map(row => ({
    ...mapRowToDiscoveryItem(row),
    ...mapSavedMedia(row),
    addedAt: row.added_at,
    note: row.note,
    readAt: row.read_at,
  }));
}

export async function getLegacyFavouriteCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM favourites WHERE account_id = 0');
  return row?.count ?? 0;
}

export async function importLegacyFavourites(accountId: number) {
  await writeDatabase(async db => {
    await db.runAsync(
      `INSERT INTO favourites (account_id, local_id, added_at)
       SELECT ?, local_id, added_at FROM favourites WHERE account_id = 0
       ON CONFLICT DO NOTHING`,
      [accountId],
    );
    await db.runAsync('DELETE FROM favourites WHERE account_id = 0');
  });
}

export async function saveFieldNote(accountId: number, localId: string, input: string | null) {
  const note = input?.trim() || null;
  if (note && note.length > NOTE_LIMIT) throw new Error('Note is too long');
  await writeDatabase(async db => {
    const result = await db.runAsync(
      'UPDATE favourites SET note = ? WHERE account_id = ? AND local_id = ?',
      [note, accountId, localId],
    );
    if (!result.changes) throw new Error('Save this discovery before adding a note');
  });
  return note;
}
