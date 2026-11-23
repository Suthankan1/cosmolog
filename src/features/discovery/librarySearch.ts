import { getDatabase } from '../../database/db';
import { mapRowToDiscoveryItem, type CachedItemRow } from '../../database/models';
import type { DiscoverySource } from '../../navigation/types';

const fold = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

export function matchLibrary(rows: CachedItemRow[], query: string) {
  const terms = fold(query.trim()).split(/\s+/).filter(Boolean);
  const matches = rows.flatMap(row => {
    const title = fold(row.title);
    if (terms.every(term => title.includes(term))) return [{ row, titleMatch: true }];
    const searchable = fold([row.title, row.summary, row.body, row.author, row.attribution,
      row.source === 'nasa-apod' ? 'NASA APOD' : 'Spaceflight News'].join(' '));
    return terms.every(term => searchable.includes(term)) ? [{ row, titleMatch: false }] : [];
  });
  matches.sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch) ||
    (b.row.published_at ?? '').localeCompare(a.row.published_at ?? '') ||
    a.row.local_id.localeCompare(b.row.local_id));
  return { total: matches.length, items: matches.slice(0, 100).map(match => mapRowToDiscoveryItem(match.row)) };
}

export async function searchLibrary(accountId: number, source: 'all' | DiscoverySource, query: string) {
  const db = await getDatabase();
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const rows = await db.getAllAsync<CachedItemRow>(
    `SELECT c.* FROM cached_items c WHERE (? = 'all' OR c.source = ?)
     AND (c.fetched_at >= ? OR EXISTS (SELECT 1 FROM feed_membership WHERE local_id = c.local_id)
      OR EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id AND account_id = ?)
      OR EXISTS (SELECT 1 FROM reading_checkpoint WHERE local_id = c.local_id AND account_id = ?)
      OR EXISTS (SELECT 1 FROM reading_history WHERE local_id = c.local_id AND account_id = ?))
     ORDER BY CASE
       WHEN EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id AND account_id = ?) THEN 0
       WHEN EXISTS (SELECT 1 FROM feed_membership WHERE local_id = c.local_id) THEN 1
       ELSE 2 END, c.fetched_at DESC, c.local_id LIMIT 1500`,
    [source, source, cutoff, accountId, accountId, accountId, accountId],
  );
  return matchLibrary(rows, query);
}
