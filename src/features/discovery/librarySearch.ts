import { getDatabase, writeDatabase } from '../../database/db';
import { mapRowToDiscoveryItem, type CachedItemRow, type DiscoveryItem } from '../../database/models';
import { foldSearch } from '../../database/searchText';
import type { DiscoverySource } from '../../navigation/types';

export type SearchCategory = 'all' | DiscoverySource;

export async function searchLibrary(accountId: number, source: SearchCategory, query: string, limit = 100) {
  const terms = [...new Set(foldSearch(query.trim()).split(/\s+/).filter(Boolean))];
  const contains = (field: string) => terms.map(() => 'instr(' + field + ', ?) > 0').join(' AND ') || '1';
  const db = await getDatabase();
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const rows = await db.getAllAsync<CachedItemRow & { total: number }>(
    `SELECT c.*, COUNT(*) OVER () AS total FROM cached_items c WHERE (? = 'all' OR c.source = ?)
     AND (c.fetched_at >= ? OR EXISTS (SELECT 1 FROM feed_membership WHERE local_id = c.local_id)
      OR EXISTS (SELECT 1 FROM search_members WHERE local_id = c.local_id AND account_id = ?)
      OR EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id AND account_id = ?)
      OR EXISTS (SELECT 1 FROM reading_checkpoint WHERE local_id = c.local_id AND account_id = ?)
      OR EXISTS (SELECT 1 FROM reading_history WHERE local_id = c.local_id AND account_id = ?))
     AND ${contains('search_text')}
     ORDER BY (${contains('search_title')}) DESC, published_at DESC, c.local_id LIMIT ?`,
    [source, source, cutoff, accountId, accountId, accountId, accountId, ...terms, ...terms, limit]);
  return { total: rows[0]?.total ?? 0, items: rows.map(mapRowToDiscoveryItem) };
}

export async function saveSearch(account: number, category: SearchCategory, query: string, items: DiscoveryItem[], signal: AbortSignal) {
  await writeDatabase(async db => {
    if (signal.aborted) return;
    await db.runAsync('INSERT OR REPLACE INTO last_search VALUES (?, ?, ?)', [account, category, query]);
    for (const [position, item] of items.entries()) {
      await db.runAsync('INSERT INTO search_members VALUES (?, ?, ?, ?)', [account, category, position, item.localId]);
    }
    if (signal.aborted) throw new Error('Search changed');
  });
}

export async function lastSearch(account: number, category: SearchCategory) {
  const db = await getDatabase();
  return db.getFirstAsync<{ query: string; category: SearchCategory }>(
    "SELECT query, category FROM last_search WHERE account_id=? AND (?='all' OR category=?) ORDER BY rowid DESC LIMIT 1",
    [account, category, category]);
}

export async function readSearch(account: number, category: SearchCategory, query: string) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CachedItemRow>(
    `SELECT c.* FROM last_search s JOIN search_members m USING(account_id, category)
     JOIN cached_items c USING(local_id) WHERE account_id=? AND category=? AND query=? ORDER BY m.position`,
    [account, category, query]);
  return rows.map(mapRowToDiscoveryItem);
}
