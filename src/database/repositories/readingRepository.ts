import { getDatabase, writeDatabase } from '../db';
import { mapRowToDiscoveryItem, type CachedItemRow } from '../models';

interface ReadingRow extends CachedItemRow {
  paragraph: number;
  fingerprint: string;
}

export async function getReadingCheckpoint(accountId: number) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReadingRow>(
    `SELECT c.*, r.paragraph, r.fingerprint FROM reading_checkpoint r
     JOIN cached_items c ON c.local_id = r.local_id WHERE r.account_id = ?`, [accountId],
  );
  return row ? { item: mapRowToDiscoveryItem(row), paragraph: row.paragraph, fingerprint: row.fingerprint } : null;
}

export async function saveReadingCheckpoint(accountId: number, localId: string, paragraph: number, fingerprint: string) {
  await writeDatabase(async db => {
    await db.runAsync(
      `INSERT INTO reading_checkpoint (account_id, local_id, paragraph, fingerprint, updated_at)
       SELECT ?, local_id, ?, ?, ? FROM cached_items WHERE local_id = ?
       AND NOT EXISTS (SELECT 1 FROM reading_history WHERE account_id = ? AND local_id = cached_items.local_id)
       ON CONFLICT(account_id) DO UPDATE SET local_id = excluded.local_id, paragraph = excluded.paragraph,
         fingerprint = excluded.fingerprint, updated_at = excluded.updated_at`,
      [accountId, paragraph, fingerprint, new Date().toISOString(), localId, accountId],
    );
  });
}

export async function clearReadingCheckpoint(accountId: number, localId: string) {
  return writeDatabase(db => db.runAsync(
    'DELETE FROM reading_checkpoint WHERE account_id = ? AND local_id = ?', [accountId, localId],
  ));
}

export async function getReadAt(accountId: number, localId: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ read_at: string }>(
    'SELECT read_at FROM reading_history WHERE account_id = ? AND local_id = ?', [accountId, localId],
  );
  return row?.read_at ?? null;
}

export async function getReadingHistory(accountId: number) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CachedItemRow & { read_at: string }>(
    `SELECT c.*, h.read_at FROM reading_history h JOIN cached_items c ON c.local_id = h.local_id
     WHERE h.account_id = ? ORDER BY h.read_at DESC, h.local_id`, [accountId],
  );
  return rows.map(row => ({ ...mapRowToDiscoveryItem(row), readAt: row.read_at }));
}

export async function markDiscoveryRead(accountId: number, localId: string) {
  await writeDatabase(async db => {
    await db.runAsync(
      'INSERT INTO reading_history VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
      [accountId, localId, new Date().toISOString()],
    );
    await db.runAsync('DELETE FROM reading_checkpoint WHERE account_id = ? AND local_id = ?', [accountId, localId]);
  });
}
