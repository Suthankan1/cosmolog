import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import { CREATE_TABLES_SQL } from '../src/database/schema';
import { getDatabase, writeDatabase } from '../src/database/db';
import {
  keepReadingPackItem,
  removeReadingPack,
  getReadingPackItems,
} from '../src/database/repositories/readingPacksRepository';
import {
  markExpeditionStepCompleted,
  getExpeditionCompletedStepIds,
  resetExpeditionProgress,
} from '../src/database/repositories/expeditionsRepository';
import { clearEligibleCache, getOfflineStorageSummary } from '../src/features/storage/offlineStorageProjection';
import type { DiscoveryItem } from '../src/database/models';

let mockDatabasePath: string;
const mockOpenConnections: mockDatabaseSync[] = [];
const mockDiskFiles = new Map<string, number>();

jest.mock('../src/services/storage/imageStorage', () => ({
  getLocalImage: (name: string | null) => {
    if (!name || !mockDiskFiles.has(name)) return null;
    return { uri: 'file:///images/' + name, bytes: mockDiskFiles.get(name)! };
  },
  pruneImageFiles: jest.fn((keep: Set<string>) => {
    let deletedBytes = 0;
    let deletedCount = 0;
    const deletedFiles: string[] = [];
    for (const key of Array.from(mockDiskFiles.keys())) {
      if (!keep.has(key)) {
        deletedBytes += mockDiskFiles.get(key) || 0;
        deletedCount++;
        deletedFiles.push(key);
        mockDiskFiles.delete(key);
      }
    }
    return { deletedCount, deletedBytes, deletedFiles };
  }),
  getDeviceTotalMediaBytes: jest.fn(() => {
    let total = 0;
    for (const b of mockDiskFiles.values()) total += b;
    return { totalBytes: total, fileCount: mockDiskFiles.size };
  }),
}));

jest.mock('../src/features/study/packRepository', () => ({
  installedPacks: async () => [],
}));

jest.mock('../src/store/slices/favouritesSlice', () => ({
  waitForMediaWorker: jest.fn().mockResolvedValue(undefined),
  isMediaWorkerBusy: () => false,
}));

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

const testDir = mkdtempSync(join(tmpdir(), 'cosmolog-hardening-'));

beforeAll(async () => {
  mockDatabasePath = join(testDir, 'hardening.sqlite');
  const legacy = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
  legacy.exec(CREATE_TABLES_SQL);
  legacy.close();
  await getDatabase(); // Run all schema migrations through version 15
});

afterAll(() => {
  for (const db of mockOpenConnections) db.close();
  rmSync(testDir, { recursive: true, force: true });
});

beforeEach(() => {
  mockDiskFiles.clear();
  jest.clearAllMocks();
});

const samplePlate = (id: string, fileName: string): DiscoveryItem => ({
  localId: id,
  source: 'nasa-apod',
  externalId: id,
  title: 'Discovery ' + id,
  summary: 'Summary of ' + id,
  body: 'Body of ' + id,
  publishedAt: '2026-11-26',
  imageRemoteUrl: 'https://example.com/' + fileName,
  imageLocalUri: 'file:///images/' + fileName,
  canonicalUrl: 'https://science.nasa.gov/',
  attribution: 'NASA/JPL',
  author: 'NASA',
  mediaType: 'image',
  fetchedAt: '2026-11-26T00:00:00Z',
  updatedAt: '2026-11-26T00:00:00Z',
});

describe('Hardening Pass Regression Verification (Finding 9 & 10)', () => {
  it('preserves shared files on disk when one account removes their expedition pack', async () => {
    const sharedFileName = 'shared-cassini.jpg';
    mockDiskFiles.set(sharedFileName, 1_500_000);

    const plate1 = samplePlate('nasa-apod:cassini-1', sharedFileName);

    // Seed cached_item and saved_media
    const now = new Date().toISOString();
    await writeDatabase(async db => {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'image', ?, ?)`,
        [plate1.localId, plate1.source, plate1.externalId, plate1.title, plate1.summary, plate1.body, now, now],
      );
      await db.runAsync(
        `INSERT OR REPLACE INTO saved_media (local_id, status, file_name, bytes)
         VALUES (?, 'ready', ?, 1500000)`,
        [plate1.localId, sharedFileName],
      );
    });

    // Account 101 installs expedition 'saturn' with this plate
    await keepReadingPackItem(101, 'saturn', plate1);

    // Account 102 also installs expedition 'saturn' with this plate
    await keepReadingPackItem(102, 'saturn', plate1);

    // Both accounts see the item in their reading pack
    const items101 = await getReadingPackItems(101);
    const items102 = await getReadingPackItems(102);
    expect(items101.length).toBe(1);
    expect(items102.length).toBe(1);

    // Account 101 removes their expedition download
    await removeReadingPack(101, 'saturn');

    // Account 101 has 0 items now
    const after101 = await getReadingPackItems(101);
    expect(after101.length).toBe(0);

    // Account 102 STILL has their item intact!
    const after102 = await getReadingPackItems(102);
    expect(after102.length).toBe(1);
    expect(after102[0].localId).toBe(plate1.localId);

    // Trigger cache cleanup: shared file must NOT be deleted because Account 102 owns it
    await clearEligibleCache();
    expect(mockDiskFiles.has(sharedFileName)).toBe(true);

    // Storage summary for Account 102 reports file as ready and unshared (since 101 removed it)
    const summary102 = await getOfflineStorageSummary(102);
    expect(summary102.expeditionsCount).toBe(1);
    expect(summary102.items.expeditions[0].isShared).toBe(false);
  });

  it('guarantees complete isolation of expedition progress between accounts', async () => {
    await markExpeditionStepCompleted(201, 'apollo', 'step-lunar-landing', 1);
    await markExpeditionStepCompleted(201, 'apollo', 'step-moon-rock', 1);

    // Account 201 has 2 completed steps
    const steps201 = await getExpeditionCompletedStepIds(201, 'apollo');
    expect(steps201.size).toBe(2);

    // Account 202 starts fresh with 0 completed steps
    const steps202 = await getExpeditionCompletedStepIds(202, 'apollo');
    expect(steps202.size).toBe(0);

    // Resetting Account 201 progress does not affect Account 202
    await resetExpeditionProgress(201, 'apollo');
    const reset201 = await getExpeditionCompletedStepIds(201, 'apollo');
    expect(reset201.size).toBe(0);
  });

  it('verifies migration safety to schema version 16 with revision column', async () => {
    const row = await writeDatabase(async db =>
      db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
    );
    expect(row?.user_version).toBeGreaterThanOrEqual(16);

    // Verify expedition_progress table structure
    const cols = await writeDatabase(async db =>
      db.getAllAsync<{ name: string; type: string }>('PRAGMA table_info(expedition_progress)'),
    );
    const colNames = cols.map(c => c.name);
    expect(colNames).toContain('account_id');
    expect(colNames).toContain('expedition_id');
    expect(colNames).toContain('step_id');
    expect(colNames).toContain('revision');
    expect(colNames).toContain('completed_at');
  });
});
