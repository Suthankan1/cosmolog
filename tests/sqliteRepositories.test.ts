import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import { CREATE_TABLES_SQL } from '../src/database/schema';
import { commitFeedSnapshot, getCachedFeed, getDiscoveryItemById, upsertDiscoveryItems } from '../src/database/repositories/discoveryRepository';
import { getFavourites, getLegacyFavouriteCount, importLegacyFavourites, saveFieldNote, setFavourite } from '../src/database/repositories/favouritesRepository';
import { getSyncMetadata, recordSyncFailure } from '../src/database/repositories/syncMetadataRepository';
import { writeDatabase } from '../src/database/db';
import type { DiscoveryItem } from '../src/database/models';

jest.mock('../src/services/storage/imageStorage', () => ({ getLocalImage: () => null }));

let mockDatabasePath: string;
const mockOpenConnections: mockDatabaseSync[] = [];
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => {
    const db = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    mockOpenConnections.push(db);
    return {
      execAsync: async (sql: string) => db.exec(sql),
      getFirstAsync: async (sql: string, args: never[] = []) => db.prepare(sql).get(...args),
      getAllAsync: async (sql: string, args: never[] = []) => db.prepare(sql).all(...args),
      runAsync: async (sql: string, args: never[] = []) => db.prepare(sql).run(...args),
      closeAsync: async () => db.close(),
      withTransactionAsync: async (work: () => Promise<void>) => {
        db.exec('BEGIN');
        try {
          await work();
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    };
  },
}));

const time = '2026-11-23T00:00:00.000Z';
const legacyId = 'nasa-apod:2026-11-22';
const item: DiscoveryItem = {
  localId: 'spaceflight-news:1', source: 'spaceflight-news', externalId: '1',
  title: 'Lunar flight', body: 'A lunar mission.', summary: 'A lunar mission.', publishedAt: time,
  imageRemoteUrl: null, imageLocalUri: null, canonicalUrl: null, attribution: 'Publisher',
  author: null, mediaType: 'article', fetchedAt: time, updatedAt: time,
};

const dir = mkdtempSync(join(tmpdir(), 'cosmolog-sqlite-'));
beforeAll(() => {
  mockDatabasePath = join(dir, 'archive.sqlite');
  const legacy = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
  legacy.exec(CREATE_TABLES_SQL);
  legacy.prepare(
    `INSERT INTO cached_items (local_id, source, external_id, title, body, summary, media_type, fetched_at, updated_at)
     VALUES (?, 'nasa-apod', '2026-11-22', 'Legacy plate', 'Body', 'Summary', 'image', ?, ?)`,
  ).run(legacyId, time, time);
  legacy.prepare('INSERT INTO favourites VALUES (?, ?)').run(legacyId, time);
  legacy.prepare('INSERT INTO favourites VALUES (?, ?)').run('missing', time);
  legacy.close();
});

afterAll(() => {
  for (const db of mockOpenConnections) db.close();
  rmSync(dir, { recursive: true, force: true });
});

it('migrates actual SQLite data, rejects orphans and recovers earlier bookmarks only by import', async () => {
  expect((await getCachedFeed()).some(entry => entry.localId === legacyId)).toBe(true);
  expect(await getLegacyFavouriteCount()).toBe(1);
  expect(await getFavourites(2)).toEqual([]);
  await importLegacyFavourites(1);
  expect((await getFavourites(1))[0].localId).toBe(legacyId);
  expect(await getLegacyFavouriteCount()).toBe(0);
  expect(await getFavourites(2)).toEqual([]);
  await expect(writeDatabase(db => db.runAsync('INSERT INTO favourites (account_id, local_id, added_at) VALUES (1, ?, ?)', ['missing', time])))
    .rejects.toThrow(/FOREIGN KEY/i);
});

it('commits unique feed membership and time together, and keeps bookmarks on a valid empty refresh', async () => {
  await commitFeedSnapshot('spaceflight-news', [item, item], time);
  await setFavourite(2, item.localId, true);
  expect((await getCachedFeed()).filter(entry => entry.source === item.source)).toHaveLength(1);
  expect((await getSyncMetadata(item.source)).lastSyncedAt).toBe(time);
  await recordSyncFailure(item.source, 'Source unavailable');
  expect((await getSyncMetadata(item.source)).lastSyncedAt).toBe(time);
  await commitFeedSnapshot(item.source, [], '2026-11-24T00:00:00.000Z');
  expect((await getCachedFeed()).filter(entry => entry.source === item.source)).toHaveLength(0);
  expect((await getFavourites(2))[0].localId).toBe(item.localId);
  expect((await getSyncMetadata(item.source)).error).toBeNull();
});

it('isolates direct Details records from Discover and rolls back a failed snapshot', async () => {
  await upsertDiscoveryItems([item]);
  expect(await getDiscoveryItemById(item.localId)).toMatchObject({ title: item.title });
  expect(await getCachedFeed()).not.toContainEqual(expect.objectContaining({ localId: item.localId }));
  await expect(commitFeedSnapshot('nasa-apod', [item], time)).rejects.toThrow();
  expect(await getCachedFeed()).toContainEqual(expect.objectContaining({ localId: legacyId }));
  expect((await getSyncMetadata('nasa-apod')).lastSyncedAt).toBeNull();
});

it('stores notes privately, preserves them during refresh and deletes them with the owning bookmark', async () => {
  await setFavourite(1, item.localId, true);
  await saveFieldNote(1, item.localId, '  Look up the mission timeline.  ');
  expect((await getFavourites(1)).find(entry => entry.localId === item.localId)?.note).toBe('Look up the mission timeline.');
  expect((await getFavourites(2)).find(entry => entry.localId === item.localId)?.note).toBeNull();
  await commitFeedSnapshot('spaceflight-news', [item], time);
  expect((await getFavourites(1)).find(entry => entry.localId === item.localId)?.note).toBe('Look up the mission timeline.');
  await setFavourite(1, item.localId, false);
  await expect(saveFieldNote(1, item.localId, 'Missing bookmark')).rejects.toThrow();
});
