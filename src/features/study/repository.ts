import { getDatabase, writeDatabase } from '../../database/db';
import { edition, studyEntries, sectionAnchor, sectionNumber } from './edition';

export interface StudyRow {
  id: string;
  title: string;
  category: string;
  body: string;
  source: string;
  url: string;
  related: string;
  chapter: number | null;
  sky: number;
}
export type Listing = Pick<StudyRow, 'id' | 'title' | 'category'> & { anchor: string | null };
let ready: Promise<void> | undefined;
export function prepareGuide() {
  ready ??= writeDatabase(async (db) => {
    const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM study_meta WHERE key='edition'");
    if (row?.value === edition) return;
    for (const e of studyEntries) {
      await db.runAsync(
        `INSERT INTO study_entries (id,title,category,body,source,url,related,chapter,sky) VALUES (?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title,category=excluded.category,body=excluded.body,
        source=excluded.source,url=excluded.url,related=excluded.related,chapter=excluded.chapter,sky=excluded.sky`,
        [
          e.id,
          e.title,
          e.category,
          e.body,
          e.source,
          e.url,
          JSON.stringify(e.related),
          e.chapter ?? null,
          Number(!!e.sky),
        ],
      );
      await db.runAsync('DELETE FROM study_aliases WHERE entry_id=?', [e.id]);
      for (const alias of e.aliases)
        await db.runAsync('INSERT OR IGNORE INTO study_aliases VALUES (?,?)', [alias, e.id]);
    }
    await db.runAsync("INSERT OR REPLACE INTO study_meta VALUES ('edition',?)", [edition]);
  }).catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
}
export async function listStudy(
  query: string,
  saved: boolean,
  account: number,
  limit: number,
  atlas = false,
) {
  await prepareGuide();
  const db = await getDatabase();
  const term = query.trim();
  const pattern = '%' + term.replace(/[!%_]/g, '!$&') + '%';
  return db.getAllAsync<Listing>(
    `SELECT e.id,title,category,b.section_anchor AS anchor FROM study_entries e LEFT JOIN study_bookmarks b ON b.entry_id=e.id AND b.account=? WHERE
    (?=0 OR EXISTS (SELECT 1 FROM study_bookmarks WHERE account=? AND entry_id=e.id))
    AND (?<>'' OR ?=1 OR CASE WHEN ?=1 THEN chapter IS NULL ELSE chapter IS NOT NULL END)
    AND (title LIKE ? ESCAPE '!' OR body LIKE ? ESCAPE '!' OR e.id=? OR EXISTS
      (SELECT 1 FROM study_aliases WHERE entry_id=e.id AND name LIKE ? ESCAPE '!'))
    ORDER BY CASE WHEN title=? OR e.id=? OR EXISTS (SELECT 1 FROM study_aliases WHERE entry_id=e.id AND name=?) THEN 0
      WHEN title LIKE ? ESCAPE '!' THEN 1 ELSE 2 END, chapter IS NULL,chapter,title LIMIT ?`,
    [
      account,
      Number(saved),
      account,
      term,
      Number(saved),
      Number(atlas),
      pattern,
      pattern,
      term,
      pattern,
      term,
      term,
      term,
      pattern,
      limit,
    ],
  );
}
export async function readStudy(id: string, account: number) {
  await prepareGuide();
  const db = await getDatabase();
  const entry = await db.getFirstAsync<StudyRow>('SELECT * FROM study_entries WHERE id=?', [id]);
  const marked = await db.getFirstAsync<{ note: string | null }>(
    'SELECT note FROM study_bookmarks WHERE account=? AND entry_id=?',
    [account, id],
  );
  return { entry, marked: !!marked, note: marked?.note ?? null };
}
export async function bookmarkStudy(account: number, id: string, save: boolean, section = 0) {
  await writeDatabase((db) =>
    db.runAsync(
      save
        ? 'INSERT INTO study_bookmarks(account,entry_id,section_anchor) VALUES (?,?,?) ON CONFLICT(account,entry_id) DO UPDATE SET section_anchor=excluded.section_anchor'
        : 'DELETE FROM study_bookmarks WHERE account=? AND entry_id=?',
      save ? [account, id, sectionAnchor(id, section)] : [account, id],
    ),
  );
}
export async function checkpoint(account: number, id: string, section: number) {
  await writeDatabase((db) =>
    db.runAsync('INSERT OR REPLACE INTO study_progress VALUES (?,?,?,?)', [
      account,
      id,
      section,
      sectionAnchor(id, section),
    ]),
  );
}
export async function resumeStudy(account: number) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    entry_id: string;
    section: number;
    section_anchor: string | null;
    title: string;
  }>(
    'SELECT entry_id,section,section_anchor,title FROM study_progress JOIN study_entries ON id=entry_id WHERE account=?',
    [account],
  );
  return row ? { ...row, section: sectionNumber(row.entry_id, row.section_anchor, row.section) } : null;
}

export async function saveStudyNote(account: number, id: string, note: string | null) {
  const changed = await writeDatabase((db) =>
    db.runAsync('UPDATE study_bookmarks SET note=? WHERE account=? AND entry_id=?', [
      note?.trim().slice(0, 1000) || null,
      account,
      id,
    ]),
  );
  if (!changed.changes) throw Error('Bookmark unavailable');
}
