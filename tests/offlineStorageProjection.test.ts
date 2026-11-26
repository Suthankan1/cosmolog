import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import { getDatabase } from '../src/database/db';
import { CREATE_TABLES_SQL } from '../src/database/schema';
import {
  clearEligibleCache,
  getOfflineStorageSummary,
  previewClearCache,
} from '../src/features/storage/offlineStorageProjection';

const mockImages = new Map<string, number>();
const prunedCalls: Set<string>[] = [];

jest.mock('../src/services/storage/imageStorage', () => ({
  getLocalImage: (name: string | null) => {
    if (!name || !mockImages.has(name)) return null;
    return { uri: 'file:///images/' + name, bytes: mockImages.get(name)! };
  },
  pruneImageFiles: (keep: Set<string>) => {
    prunedCalls.push(keep);
    let deletedBytes = 0;
    let deletedCount = 0;
    const deletedFiles: string[] = [];
    for (const [key, bytes] of Array.from(mockImages.entries())) {
      if (!keep.has(key)) {
        deletedBytes += bytes;
        deletedCount++;
        deletedFiles.push(key);
        mockImages.delete(key);
      }
    }
    return { deletedCount, deletedBytes, deletedFiles };
  },
  getDeviceTotalMediaBytes: () => {
    let total = 0;
    for (const b of mockImages.values()) total += b;
    return { totalBytes: total, fileCount: mockImages.size };
  },
}));

jest.mock('../src/features/study/packRepository', () => ({
  installedPacks: async () => [
    { id: 'observatories', revision: 1, bytes: 50_000, installed_at: '2026-11-26T00:00:00Z' },
  ],
}));

const mockWithExclusiveMediaLock = jest.fn(async <T>(action: () => Promise<T>): Promise<T> => action());
jest.mock('../src/services/storage/mediaCoordinator', () => ({
  withExclusiveMediaLock: <T>(action: () => Promise<T>) => mockWithExclusiveMediaLock(action),
  isMediaOperationInProgress: () => false,
  waitForMediaOperations: jest.fn().mockResolvedValue(undefined),
}));

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

const dir = mkdtempSync(join(tmpdir(), 'cosmolog-storage-'));
beforeAll(async () => {
  mockDatabasePath = join(dir, 'storage.sqlite');
  const legacy = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
  legacy.exec(CREATE_TABLES_SQL);
  legacy.close();
  // Trigger openDatabase() to run all migrations (1 to 15)
  await getDatabase();
});

afterAll(() => {
  for (const db of mockOpenConnections) db.close();
  rmSync(dir, { recursive: true, force: true });
});

beforeEach(() => {
  mockImages.clear();
  prunedCalls.length = 0;
});

describe('Offline Storage Projection (F02)', () => {
  it('deduplicates shared physical files across favourites and packs', async () => {
    mockImages.set('shared-plate.jpg', 2_000_000);
    mockImages.set('unique-plate.jpg', 1_000_000);

    // Setup items in db
    const conn = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    const now = new Date().toISOString();

    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
       VALUES ('nasa-apod:item1', 'nasa-apod', 'item1', 'Shared Plate', 'Summary', 'Body', 'image', ?, ?)`
    ).run(now, now);
    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
       VALUES ('nasa-apod:item2', 'nasa-apod', 'item2', 'Unique Plate', 'Summary', 'Body', 'image', ?, ?)`
    ).run(now, now);

    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
       VALUES ('nasa-apod:item1', 'ready', 'shared-plate.jpg', 2000000)`
    ).run();
    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
       VALUES ('nasa-apod:item2', 'ready', 'unique-plate.jpg', 1000000)`
    ).run();

    // Account 1 has item1 in favourites AND in reading pack
    conn.prepare(
      `INSERT OR REPLACE INTO favourites (account_id, local_id, added_at) VALUES (1, 'nasa-apod:item1', ?)`
    ).run(now);
    conn.prepare(
      `INSERT OR REPLACE INTO reading_pack_items (account_id, pack_id, local_id, added_at) VALUES (1, 'saturn', 'nasa-apod:item1', ?)`
    ).run(now);

    // Account 1 has item2 in favourites only
    conn.prepare(
      `INSERT OR REPLACE INTO favourites (account_id, local_id, added_at) VALUES (1, 'nasa-apod:item2', ?)`
    ).run(now);

    conn.close();

    const summary = await getOfflineStorageSummary(1);

    // item1 is present in both favourites and pack, but shared-plate.jpg is counted once in physicalMediaBytes
    // physicalMediaBytes = 2,000,000 (shared-plate.jpg) + 1,000,000 (unique-plate.jpg) = 3,000,000
    // totalRetainedBytes = 3,000,000 (media) + 50,000 (study pack) = 3,050,000
    expect(summary.physicalMediaBytes).toBe(3_000_000);
    expect(summary.totalRetainedBytes).toBe(3_050_000);
    expect(summary.totalUniqueFilesCount).toBe(2);

    // Both categories list their respective item
    expect(summary.favouritesCount).toBe(2);
    expect(summary.expeditionsCount).toBe(1);
    expect(summary.studyCount).toBe(1);
  });

  it('handles missing file gracefully without throwing or inflating bytes', async () => {
    // Missing file that does not exist in mockImages
    const conn = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    const now = new Date().toISOString();

    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
       VALUES ('nasa-apod:ghost', 'nasa-apod', 'ghost', 'Ghost Plate', 'Summary', 'Body', 'image', ?, ?)`
    ).run(now, now);
    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
       VALUES ('nasa-apod:ghost', 'ready', 'ghost.jpg', 500000)`
    ).run();
    conn.prepare(
      `INSERT OR REPLACE INTO favourites (account_id, local_id, added_at) VALUES (3, 'nasa-apod:ghost', ?)`
    ).run(now);
    conn.close();

    const summary = await getOfflineStorageSummary(3);
    const ghostItem = summary.items.favourites.find(f => f.id === 'nasa-apod:ghost');

    expect(ghostItem).toBeDefined();
    // Since file is missing from disk, measured physical bytes is 0
    expect(ghostItem?.bytes).toBe(0);
  });

  it('identifies shared ownership between multiple accounts', async () => {
    mockImages.set('shared-both.jpg', 500_000);
    const conn = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    const now = new Date().toISOString();

    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
       VALUES ('nasa-apod:multi', 'nasa-apod', 'multi', 'Multi-user plate', 'Summary', 'Body', 'image', ?, ?)`
    ).run(now, now);
    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
       VALUES ('nasa-apod:multi', 'ready', 'shared-both.jpg', 500000)`
    ).run();

    // Account 1 and Account 2 both favourited this
    conn.prepare(`INSERT OR REPLACE INTO favourites (account_id, local_id, added_at) VALUES (1, 'nasa-apod:multi', ?)`).run(now);
    conn.prepare(`INSERT OR REPLACE INTO favourites (account_id, local_id, added_at) VALUES (2, 'nasa-apod:multi', ?)`).run(now);
    conn.close();

    const summary1 = await getOfflineStorageSummary(1);
    const multiItem1 = summary1.items.favourites.find(f => f.id === 'nasa-apod:multi');
    expect(multiItem1?.isShared).toBe(true);

    const summary2 = await getOfflineStorageSummary(2);
    const multiItem2 = summary2.items.favourites.find(f => f.id === 'nasa-apod:multi');
    expect(multiItem2?.isShared).toBe(true);
  });

  it('previews and clears eligible cache while strictly preserving favourites and packs', async () => {
    mockImages.set('unowned-cache.jpg', 800_000);
    const conn = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    const now = new Date().toISOString();

    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
       VALUES ('nasa-apod:unowned', 'nasa-apod', 'unowned', 'Unowned Feed Item', 'Summary', 'Body', 'image', ?, ?)`
    ).run(now, now);
    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
       VALUES ('nasa-apod:unowned', 'ready', 'unowned-cache.jpg', 800000)`
    ).run();
    conn.close();

    const preview = await previewClearCache(1);
    expect(preview.reclaimableCount).toBeGreaterThan(0);
    expect(preview.reclaimableBytes).toBeGreaterThanOrEqual(800_000);
    expect(preview.protectedFavouritesCount).toBeGreaterThan(0);

    const cleared = await clearEligibleCache();
    expect(cleared.clearedCount).toBeGreaterThanOrEqual(1);
    expect(prunedCalls.length).toBeGreaterThan(0);

    // After clearing, favourites and reading packs remain intact
    const summaryAfter = await getOfflineStorageSummary(1);
    expect(summaryAfter.favouritesCount).toBeGreaterThan(0);
    expect(summaryAfter.items.favourites.some(f => f.id === 'nasa-apod:item1')).toBe(true);
  });

  it('coordinates cache cleanup under exclusive media lock to prevent race conditions (Finding 4)', async () => {
    mockWithExclusiveMediaLock.mockClear();
    await clearEligibleCache();
    expect(mockWithExclusiveMediaLock).toHaveBeenCalledTimes(1);
  });

  it('excludes unowned cache files from reclaimable storage if referenced by another active owner', async () => {
    mockImages.set('shared-cache.jpg', 600_000);
    const conn = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    const now = new Date().toISOString();

    // Account 1 has unowned cache item with file shared-cache.jpg
    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
       VALUES ('nasa-apod:unowned-shared', 'nasa-apod', 'unowned-shared', 'Unowned Item', 'Summary', 'Body', 'image', ?, ?)`
    ).run(now, now);
    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
       VALUES ('nasa-apod:unowned-shared', 'ready', 'shared-cache.jpg', 600000)`
    ).run();

    // Account 2 has favourite pointing to another cached item with the SAME physical file
    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
       VALUES ('nasa-apod:account2-fav', 'nasa-apod', 'account2-fav', 'Account 2 Fav', 'Summary', 'Body', 'image', ?, ?)`
    ).run(now, now);
    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
       VALUES ('nasa-apod:account2-fav', 'ready', 'shared-cache.jpg', 600000)`
    ).run();
    conn.prepare(
      `INSERT OR REPLACE INTO favourites (account_id, local_id, added_at) VALUES (2, 'nasa-apod:account2-fav', ?)`
    ).run(now);
    conn.close();

    // For Account 1, shared-cache.jpg is NOT reclaimable because Account 2 retains it
    const summary = await getOfflineStorageSummary(1);
    const cacheItem = summary.items.cache.find(c => c.id === 'nasa-apod:unowned-shared');
    expect(cacheItem).toBeDefined();
    expect(cacheItem?.bytes).toBe(0); // Not reclaimable

    const preview = await previewClearCache(1);
    expect(preview.reclaimableBytes).toBe(0);

    prunedCalls.length = 0;
    await clearEligibleCache();
    expect(prunedCalls.length).toBeGreaterThan(0);
    const lastRetainedSet = prunedCalls[prunedCalls.length - 1];
    expect(lastRetainedSet.has('shared-cache.jpg')).toBe(true);
    expect(mockImages.has('shared-cache.jpg')).toBe(true);
  });

  it('honestly distinguishes physical media, study text, and reclaimable bytes (Finding 5)', async () => {
    mockImages.set('shared-plate.jpg', 2_000_000);
    mockImages.set('unique-plate.jpg', 1_000_000);

    const summary = await getOfflineStorageSummary(1);
    expect(summary.physicalMediaBytes).toBe(3_000_000); // Only on-disk binary images
    expect(summary.installedStudyTextBytes).toBe(50_000); // Only SQLite study pack curriculum
    expect(summary.totalRetainedBytes).toBe(3_050_000); // Sum of physical and study text
    expect(summary.reclaimableMediaBytes).toBe(0); // All unowned files already cleaned
  });

  it('reuses canonical mapSavedMedia policy validation for media status (Finding 3)', async () => {
    const conn = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    const now = new Date().toISOString();

    // Insert an item with mismatched/disallowed license
    conn.prepare(
      `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at, image_license_url)
       VALUES ('nasa-apod:restricted', 'nasa-apod', 'restricted', 'Restricted License Plate', 'Summary', 'Body', 'image', ?, ?, 'https://prohibited-license.org')`
    ).run(now, now);
    conn.prepare(
      `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes, license_url)
       VALUES ('nasa-apod:restricted', 'failed', 'restricted.jpg', 400000, 'https://prohibited-license.org')`
    ).run();
    conn.prepare(
      `INSERT OR REPLACE INTO favourites (account_id, local_id, added_at) VALUES (8, 'nasa-apod:restricted', ?)`
    ).run(now);
    conn.close();

    const summary = await getOfflineStorageSummary(8);
    const item = summary.items.favourites.find(f => f.id === 'nasa-apod:restricted');
    expect(item).toBeDefined();
    // Due to canonical policy validation, prohibited license is safely degraded to 'text-only'
    expect(item?.status).toBe('text-only');
  });
});
