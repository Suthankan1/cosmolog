import { z } from 'zod';
import { getDatabase, writeDatabase } from '../../database/db';
import type { SQLiteDatabase } from 'expo-sqlite';

const slug = z.string().regex(/^[a-z0-9-]{1,60}$/);
const part = z.object({
  file: z.string().regex(/^[a-z0-9-]{1,60}\.json$/),
  bytes: z.number().int().min(2).max(512000),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  count: z.number().int().positive().max(500),
});
const pack = z.object({
  id: slug,
  title: z.string().min(1).max(100),
  revision: z.number().int().positive(),
  parts: z.array(part).min(1).max(16),
});
export const manifestSchema = z
  .object({ format: z.literal(1), packs: z.array(pack).max(30) })
  .refine(
    (m) =>
      new Set(m.packs.map((p) => p.id)).size === m.packs.length &&
      m.packs.every((p) => new Set(p.parts.map((x) => x.file)).size === p.parts.length),
  );
export type CatalogPack = z.infer<typeof pack>;
export const packEntries = z
  .array(
    z.object({
      id: slug,
      title: z.string().min(1).max(120),
      body: z.string().min(1).max(24000),
      source: z.string().min(1).max(150),
      url: z.url({ protocol: /^https$/ }),
      aliases: z.array(z.string().min(1).max(100)).max(30),
    }),
  )
  .max(500);
type PackEntry = z.infer<typeof packEntries>[number];
export function packSize(p: CatalogPack) {
  return p.parts.reduce((sum, file) => sum + file.bytes, 0);
}
export async function installedPacks() {
  return (await getDatabase()).getAllAsync<{
    id: string;
    revision: number;
    bytes: number;
    installed_at: string;
  }>('SELECT * FROM study_packs');
}
async function prune(db: SQLiteDatabase, id: string, keep: Set<string>) {
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM study_entries WHERE pack_id=?
    AND NOT EXISTS(SELECT 1 FROM study_bookmarks WHERE entry_id=study_entries.id)`,
    [id],
  );
  for (const row of rows)
    if (!keep.has(row.id)) {
      await db.runAsync('DELETE FROM study_aliases WHERE entry_id=?', [row.id]);
      await db.runAsync('DELETE FROM study_entries WHERE id=?', [row.id]);
    }
}
export async function removePack(id: string) {
  await writeDatabase(async (db) => {
    await prune(db, id, new Set());
    await db.runAsync('DELETE FROM study_packs WHERE id=?', [id]);
  });
}
export async function activatePack(p: CatalogPack, entries: PackEntry[]) {
  const expected = p.parts.reduce((sum, file) => sum + file.count, 0);
  if (entries.length !== expected || new Set(entries.map((e) => e.id)).size !== expected)
    throw Error('Pack record count mismatch');
  await writeDatabase(async (db) => {
    const prior = await db.getFirstAsync<{ revision: number }>(
      'SELECT revision FROM study_packs WHERE id=?',
      [p.id],
    );
    if (prior && prior.revision >= p.revision) return;
    const retained = new Set<string>();
    for (const e of entries) {
      const id = 'pack:' + p.id + ':' + e.id;
      retained.add(id);
      await db.runAsync(
        `INSERT INTO study_entries(id,title,category,body,source,url,related,pack_id)
        VALUES (?,?,?,?,?,?,'[]',?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,category=excluded.category,
        body=excluded.body,source=excluded.source,url=excluded.url`,
        [id, e.title, p.title, e.body, e.source, e.url, p.id],
      );
      await db.runAsync('DELETE FROM study_aliases WHERE entry_id=?', [id]);
      for (const a of e.aliases)
        await db.runAsync('INSERT OR IGNORE INTO study_aliases VALUES (?,?)', [a, id]);
    }
    await prune(db, p.id, retained);
    await db.runAsync('INSERT OR REPLACE INTO study_packs VALUES (?,?,?,?)', [
      p.id,
      p.revision,
      packSize(p),
      new Date().toISOString(),
    ]);
  });
}
