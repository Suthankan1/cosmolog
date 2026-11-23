import { getDatabase, writeDatabase } from '../db';
import type { CachedItemRow } from '../models';
import { mapRowToDiscoveryItem } from '../models';
import type { DiscoveryPage } from '../../services/api/spaceflightNewsService';
import { upsertItem } from './discoveryRepository';

interface Cursor { generation: string; anchor: string | null; next_offset: number | null }
const cursorSql = 'SELECT generation, anchor, next_offset FROM dispatch_paging WHERE id = 1';

export async function readDispatchWindow(limit: number) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CachedItemRow>(
    `SELECT c.* FROM feed_membership f JOIN cached_items c USING(local_id)
     WHERE f.source = 'spaceflight-news' ORDER BY c.published_at DESC, c.local_id LIMIT ?`, [limit + 1]);
  return { articles: rows.slice(0, limit).map(mapRowToDiscoveryItem), moreCached: rows.length > limit,
    cursor: await db.getFirstAsync<Cursor>(cursorSql) ?? null };
}

export async function commitDispatchPage(page: DiscoveryPage, generation: string, expected?: Cursor) {
  await writeDatabase(async db => {
    const old = await db.getFirstAsync<Cursor>(cursorSql);
    if (expected && (old?.generation !== expected.generation || old?.next_offset !== expected.next_offset)) return;
    const previousHead = !expected && old ? await db.getFirstAsync<{ local_id: string }>(
      `SELECT c.local_id FROM feed_membership f JOIN cached_items c USING(local_id)
       WHERE f.source='spaceflight-news' ORDER BY c.published_at DESC, c.local_id LIMIT 1`) : null;
    const overlaps = previousHead && page.items.some(item => item.localId === previousHead.local_id);
    for (const item of page.items) {
      if (item.source !== 'spaceflight-news') throw new Error('Unexpected dispatch source');
      await upsertItem(db, item);
      await db.runAsync('INSERT OR IGNORE INTO feed_membership VALUES (?, ?, 0)', [item.source, item.localId]);
    }
    // An overlapping head connects directly to the previously traversed archive.
    const anchor = expected || overlaps ? old!.anchor : page.anchor ?? page.items[0]?.publishedAt ?? null;
    const nextOffset = overlaps ? old!.next_offset : page.nextOffset;
    await db.runAsync('INSERT OR REPLACE INTO dispatch_paging VALUES (1, ?, ?, ?)', [generation, anchor, nextOffset]);
    if (!expected) await db.runAsync('INSERT OR REPLACE INTO sync_metadata VALUES (?, ?, ?, NULL)',
      ['spaceflight-news', generation, generation]);
  });
}
