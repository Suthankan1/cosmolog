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
       ON CONFLICT(account_id) DO UPDATE SET local_id = excluded.local_id, paragraph = excluded.paragraph,
         fingerprint = excluded.fingerprint, updated_at = excluded.updated_at`,
      [accountId, paragraph, fingerprint, new Date().toISOString(), localId],
    );
  });
}

export async function clearReadingCheckpoint(accountId: number, localId: string) {
  return writeDatabase(db => db.runAsync(
    'DELETE FROM reading_checkpoint WHERE account_id = ? AND local_id = ?', [accountId, localId],
  ));
}
