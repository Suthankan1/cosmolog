import { getDatabase, writeDatabase } from '../db';
import { mapRowToDiscoveryItem, type CachedItemRow, type DiscoveryItem } from '../models';
import { upsertItem } from './discoveryRepository';
import { mapSavedMedia, type SavedMediaRow } from './mediaRepository';

export async function getReadingPackItems(accountId: number) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CachedItemRow & SavedMediaRow & { pack_id: string }>(
    `SELECT c.*, p.pack_id, m.status, m.file_name, m.source_url, m.license_url
     FROM reading_pack_items p JOIN cached_items c ON c.local_id = p.local_id
     LEFT JOIN saved_media m ON c.local_id = m.local_id WHERE p.account_id = ?
     ORDER BY p.pack_id, p.local_id`, [accountId],
  );
  return rows.map(row => ({ ...mapRowToDiscoveryItem(row), ...mapSavedMedia(row), packId: row.pack_id }));
}

export async function keepReadingPackItem(accountId: number, packId: string, item: DiscoveryItem) {
  await writeDatabase(async db => {
    // A feed refresh may have committed a newer record while a dated request was in flight.
    if (!await db.getFirstAsync('SELECT 1 FROM cached_items WHERE local_id = ?', [item.localId])) await upsertItem(db, item);
    await db.runAsync(
      'INSERT INTO reading_pack_items (account_id, pack_id, local_id, added_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
      [accountId, packId, item.localId, new Date().toISOString()],
    );
  });
}

export async function removeReadingPack(accountId: number, packId: string) {
  await writeDatabase(db => db.runAsync('DELETE FROM reading_pack_items WHERE account_id = ? AND pack_id = ?', [accountId, packId]));
}
