import { getDatabase, writeDatabase } from '../db';

export const COLLECTION_NAME_LIMIT = 64;

export interface ShelfCollection {
  id: number;
  name: string;
  itemIds: string[];
}

export async function getCollections(accountId: number) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: number; name: string; local_id: string | null }>(
    `SELECT c.id, c.name, i.local_id FROM shelf_collections c
     LEFT JOIN shelf_collection_items i ON i.account_id = c.account_id AND i.collection_id = c.id
     WHERE c.account_id = ? ORDER BY c.name, c.id, i.local_id`, [accountId],
  );
  const collections = new Map<number, ShelfCollection>();
  for (const { id, name, local_id } of rows) {
    const collection = collections.get(id) ?? { id, name, itemIds: [] };
    collections.set(id, collection);
    if (local_id) collection.itemIds.push(local_id);
  }
  return [...collections.values()];
}

export async function saveCollectionName(accountId: number, id: number | null, input: string) {
  const name = input.trim();
  if (!name || name.length > COLLECTION_NAME_LIMIT) throw new Error('Invalid collection name');
  await writeDatabase(async db => {
    if (id === null) {
      await db.runAsync('INSERT INTO shelf_collections (account_id, name) VALUES (?, ?)', [accountId, name]);
      return;
    }
    const result = await db.runAsync('UPDATE shelf_collections SET name = ? WHERE account_id = ? AND id = ?', [name, accountId, id]);
    if (!result.changes) throw new Error('Collection missing');
  });
}

export async function setCollectionItems(accountId: number, id: number, itemIds: readonly string[]) {
  await writeDatabase(async db => {
    if (!await db.getFirstAsync('SELECT 1 FROM shelf_collections WHERE account_id = ? AND id = ?', [accountId, id])) {
      throw new Error('Collection missing');
    }
    await db.runAsync('DELETE FROM shelf_collection_items WHERE account_id = ? AND collection_id = ?', [accountId, id]);
    for (const itemId of new Set(itemIds)) {
      await db.runAsync(
        `INSERT INTO shelf_collection_items (account_id, collection_id, local_id)
         SELECT account_id, ?, local_id FROM favourites WHERE account_id = ? AND local_id = ?`,
        [id, accountId, itemId],
      );
    }
  });
}

export async function removeCollection(accountId: number, id: number) {
  await writeDatabase(db => db.runAsync('DELETE FROM shelf_collections WHERE account_id = ? AND id = ?', [accountId, id]));
}
