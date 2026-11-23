import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import { CREATE_TABLES_SQL } from '../src/database/schema';
import { commitFeedSnapshot, findCachedPlateAnniversary, getCachedFeed, getDiscoveryItemById,
  upsertDiscoveryItems } from '../src/database/repositories/discoveryRepository';
import { getFavourites, getLegacyFavouriteCount, importLegacyFavourites, saveFieldNote, setFavourite } from '../src/database/repositories/favouritesRepository';
import { getSyncMetadata, recordSyncFailure } from '../src/database/repositories/syncMetadataRepository';
import { finishImage, getPendingImages, reconcileSavedImages } from '../src/database/repositories/mediaRepository';
import { writeDatabase } from '../src/database/db';
import { clearReadingCheckpoint, getReadAt, getReadingCheckpoint, getReadingHistory, markDiscoveryRead,
  saveReadingCheckpoint } from '../src/database/repositories/readingRepository';
import { searchLibrary } from '../src/features/discovery/librarySearch';
import { getCollections, removeCollection, saveCollectionName, setCollectionItems } from '../src/database/repositories/collectionsRepository';
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

it('keeps the bookmark when an image fails, and rejects a finished file for a changed source URL', async () => {
  const nasa: DiscoveryItem = {
    ...item, source: 'nasa-apod', localId: legacyId, externalId: '2026-11-22',
    attribution: 'NASA', imageRemoteUrl: 'https://nasa.gov/first.jpg',
  };
  await upsertDiscoveryItems([nasa]);
  await setFavourite(2, nasa.localId, true);
  await finishImage(nasa.localId, nasa.imageRemoteUrl!, null);
  expect((await getFavourites(2)).find(entry => entry.localId === nasa.localId)?.mediaStatus).toBe('failed');

  await upsertDiscoveryItems([{ ...nasa, imageRemoteUrl: 'https://nasa.gov/second.jpg' }]);
  expect(await finishImage(nasa.localId, nasa.imageRemoteUrl!, { fileName: 'abandoned.jpg', bytes: 12 })).toBe(false);
  await reconcileSavedImages();
  expect(await getPendingImages(2)).toContainEqual(expect.objectContaining({
    local_id: nasa.localId,
    image_remote_url: 'https://nasa.gov/second.jpg',
  }));
});

it('keeps a reading checkpoint private, protects its cached item and clears only the matching item', async () => {
  const older = { ...item, localId: 'spaceflight-news:299', externalId: '299' };
  await upsertDiscoveryItems([older]);
  await saveReadingCheckpoint(11, older.localId, 3, 'original');
  expect(await getReadingCheckpoint(12)).toBeNull();
  await commitFeedSnapshot(item.source, [], '2027-01-23T00:00:00.000Z');
  expect(await getReadingCheckpoint(11)).toMatchObject({
    item: { localId: older.localId }, paragraph: 3, fingerprint: 'original',
  });
  await clearReadingCheckpoint(11, item.localId);
  expect(await getReadingCheckpoint(11)).not.toBeNull();
  await clearReadingCheckpoint(11, older.localId);
  expect(await getReadingCheckpoint(11)).toBeNull();
});

it('keeps finished history private and durable, and blocks late checkpoints for finished items', async () => {
  const finished = { ...item, localId: 'spaceflight-news:300', externalId: '300' };
  await upsertDiscoveryItems([finished]);
  await saveReadingCheckpoint(11, finished.localId, 2, 'original');
  await markDiscoveryRead(11, finished.localId);
  const readAt = await getReadAt(11, finished.localId);
  expect(readAt).toEqual(expect.any(String));
  await markDiscoveryRead(11, finished.localId);
  await saveReadingCheckpoint(11, finished.localId, 3, 'late');
  await commitFeedSnapshot(item.source, [], '2027-01-24T00:00:00.000Z');
  expect(await getReadingCheckpoint(11)).toBeNull();
  expect(await getReadingHistory(11)).toEqual([expect.objectContaining({ localId: finished.localId, readAt })]);
  expect(await getReadingHistory(12)).toEqual([]);
  await setFavourite(11, finished.localId, true);
  await setFavourite(12, finished.localId, true);
  expect((await getFavourites(11))[0].readAt).toBe(readAt);
  expect((await getFavourites(12))[0].readAt).toBeNull();
});

it('keeps collection membership private, supports multiple collections and removes memberships without removing bookmarks', async () => {
  const plate = { ...item, localId: 'spaceflight-news:304', externalId: '304' };
  const other = { ...item, localId: 'spaceflight-news:305', externalId: '305' };
  await upsertDiscoveryItems([plate, other]);
  await setFavourite(31, plate.localId, true);
  await setFavourite(32, other.localId, true);
  await saveCollectionName(31, null, '  Moon  ');
  await saveCollectionName(31, null, 'Saturn');
  await expect(saveCollectionName(31, null, 'moon')).rejects.toThrow();
  await saveCollectionName(32, null, 'Moon');
  const [moon, saturn] = await getCollections(31);
  await setCollectionItems(31, moon.id, [plate.localId, plate.localId, other.localId]);
  await setCollectionItems(31, saturn.id, [plate.localId]);
  await expect(setCollectionItems(32, moon.id, [other.localId])).rejects.toThrow();
  await expect(saveCollectionName(32, moon.id, 'Taken')).rejects.toThrow();
  await saveCollectionName(31, saturn.id, 'Rings');
  expect(await getCollections(31)).toEqual([
    { ...moon, itemIds: [plate.localId] }, { id: saturn.id, name: 'Rings', itemIds: [plate.localId] },
  ]);
  expect(await getCollections(32)).toEqual([expect.objectContaining({ name: 'Moon', itemIds: [] })]);
  await removeCollection(31, moon.id);
  expect((await getFavourites(31))[0].localId).toBe(plate.localId);
  await setFavourite(31, plate.localId, false);
  expect(await getCollections(31)).toEqual([{ id: saturn.id, name: 'Rings', itemIds: [] }]);
});

it('locates the newest past APOD from the same month and day in the local archive', async () => {
  const dates = ['2020-02-29', '2024-02-29', '2028-02-28', '2028-02-29', '2032-02-29'];
  await upsertDiscoveryItems(dates.map(date => (
    { ...item, localId: 'nasa-apod:' + date, source: 'nasa-apod', externalId: date, publishedAt: date }
  )));
  expect(await findCachedPlateAnniversary('2028-02-29')).toMatchObject({ externalId: '2024-02-29' });
  expect(await findCachedPlateAnniversary('2028-03-01')).toBeNull();
});

it('searches the cached public article text, ranks title matches first and excludes private notes', async () => {
  const now = new Date().toISOString();
  const title = { ...item, localId: 'spaceflight-news:401', externalId: '401', title: 'Café astronomy', fetchedAt: now };
  const body = { ...item, localId: 'spaceflight-news:402', externalId: '402', body: 'A café observation', fetchedAt: now };
  await upsertDiscoveryItems([title, body]);
  await setFavourite(21, title.localId, true);
  await saveFieldNote(21, title.localId, 'private keyword');
  expect((await searchLibrary(21, 'all', 'cafe')).items.map(entry => entry.localId)).toEqual([title.localId, body.localId]);
  expect(await searchLibrary(21, 'all', 'private keyword')).toEqual({ total: 0, items: [] });
  expect(await searchLibrary(21, 'nasa-apod', 'cafe')).toEqual({ total: 0, items: [] });
});

it('searches a thousand local records within the bounded result window', async () => {
  const fixture = Array.from({ length: 1000 }, (_, index) => ({
    ...item, localId: 'spaceflight-news:' + (10000 + index), externalId: String(10000 + index),
    title: 'Archive benchmark', fetchedAt: new Date().toISOString(),
  }));
  await upsertDiscoveryItems(fixture);
  const start = performance.now();
  const result = await searchLibrary(21, 'all', 'archive benchmark');
  expect(result.total).toBe(1000);
  expect(result.items).toHaveLength(100);
  expect(performance.now() - start).toBeLessThan(1500);
});
