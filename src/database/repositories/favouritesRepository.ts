import { getDatabase, writeDatabase } from '../db';
import { CachedItemRow, DiscoveryItem, mapRowToDiscoveryItem } from '../models';
import { getLocalImage } from '../../services/storage/imageStorage';
import { mayDownloadImage } from '../../services/api/mediaPolicy';

export type MediaStatus = 'ready' | 'waiting' | 'failed' | 'text-only';
export const NOTE_LIMIT = 1000;

export interface FavouriteDiscoveryItem extends DiscoveryItem {
  addedAt: string;
  note: string | null;
  mediaStatus: MediaStatus;
  imageBytes: number;
}

interface FavouriteRow extends CachedItemRow {
  added_at: string;
  note: string | null;
  status: Exclude<MediaStatus, 'text-only'> | null;
  file_name: string | null;
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
    `SELECT c.*, f.added_at, f.note, m.status, m.file_name FROM favourites f
     JOIN cached_items c ON c.local_id = f.local_id
     LEFT JOIN saved_media m ON m.local_id = c.local_id
     WHERE f.account_id = ? ORDER BY f.added_at DESC, c.local_id`,
    [accountId],
  );
  return rows.map(row => {
    const eligible = mayDownloadImage(row.source, row.image_remote_url, row.attribution, row.image_license_url);
    const image = eligible && row.status === 'ready' ? getLocalImage(row.file_name) : null;
    const mediaStatus: MediaStatus = eligible
      ? image ? 'ready' : row.status === 'failed' ? 'failed' : 'waiting'
      : 'text-only';
    return {
      ...mapRowToDiscoveryItem(row),
      imageLocalUri: image?.uri ?? null,
      imageBytes: image?.bytes ?? 0,
      addedAt: row.added_at,
      note: row.note,
      mediaStatus,
    };
  });
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
}
