import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import { writeDatabase } from '../src/database/db';
import {
  getTimelineItems,
  encodeCursor,
  decodeCursor,
} from '../src/features/timeline/timelineRepository';

let mockDatabasePath: string;
const mockOpenConnections: mockDatabaseSync[] = [];
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => {
    const db = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: true });
    mockOpenConnections.push(db);
    return {
      execAsync: async (sql: string) => db.exec(sql),
      getFirstAsync: async (sql: string, args: never[] = []) => db.prepare(sql).get(...args),
      getAllAsync: async (sql: string, args: never[] = []) => db.prepare(sql).all(...args),
      runAsync: async (sql: string, args: never[] = []) => {
        const info = db.prepare(sql).run(...args);
        return { changes: info.changes };
      },
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

const dir = mkdtempSync(join(tmpdir(), 'cosmolog-timeline-repo-'));
beforeAll(() => {
  mockDatabasePath = join(dir, 'test-timeline.db');
});

afterAll(() => {
  for (const conn of mockOpenConnections) {
    try {
      conn.close();
    } catch {
      // ignore
    }
  }
  rmSync(dir, { recursive: true, force: true });
});

describe('timelineRepository SQLite Read Projection', () => {
  beforeEach(async () => {
    await writeDatabase(async db => {
      // Seed discovery item
      await db.runAsync(`
        INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at, published_at, attribution)
        VALUES ('apod_1', 'nasa-apod', 'ext_apod_1', 'Pillars of Creation', 'M16 star nursery', 'Full article body', 'image', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z', 'NASA/ESA')
      `);
      await db.runAsync(`
        INSERT OR REPLACE INTO cached_items (local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at, published_at, attribution)
        VALUES ('apod_2', 'nasa-apod', 'ext_apod_2', 'Veil Nebula', 'Supernova remnant', 'Full article body 2', 'image', '2026-10-05T00:00:00.000Z', '2026-10-05T00:00:00.000Z', '2026-10-05T00:00:00.000Z', 'NASA')
      `);
      // Seed study entries
      await db.runAsync(`
        INSERT OR REPLACE INTO study_entries (id, title, category, body, source, url, related, chapter, sky)
        VALUES ('study_kepler', 'Keplerian Orbits', 'Astrodynamics', 'Laws of planetary motion', 'NASA', 'https://nasa.gov', '[]', 1, 0)
      `);
      await db.runAsync(`
        INSERT OR REPLACE INTO study_entries (id, title, category, body, source, url, related, chapter, sky)
        VALUES ('study_relativity', 'General Relativity', 'Cosmology', 'Spacetime curvature', 'ESA', 'https://esa.int', '[]', 2, 0)
      `);
    });
  });

  it('strictly isolates records by account ID (Account 1 vs Account 2)', async () => {
    await writeDatabase(async db => {
      // Clear previous records
      await db.runAsync('DELETE FROM observations');
      await db.runAsync('DELETE FROM favourites');
      await db.runAsync('DELETE FROM reading_history');
      await db.runAsync('DELETE FROM study_bookmarks');

      // Account 1 records
      await db.runAsync(`
        INSERT INTO observations (id, account_id, title, notes, observed_at, timezone, created_at, updated_at)
        VALUES ('obs_acc1', 1, 'Account 1 Saturn', 'Cassini division visible', '2026-11-20T18:00:00.000Z', 'Asia/Colombo', '2026-11-20T18:00:00.000Z', '2026-11-20T18:00:00.000Z')
      `);
      await db.runAsync(`
        INSERT INTO favourites (account_id, local_id, added_at)
        VALUES (1, 'apod_1', '2026-11-21T10:00:00.000Z')
      `);

      // Account 2 records
      await db.runAsync(`
        INSERT INTO observations (id, account_id, title, notes, observed_at, timezone, created_at, updated_at)
        VALUES ('obs_acc2', 2, 'Account 2 Jupiter', 'Great Red Spot', '2026-11-22T19:00:00.000Z', 'Asia/Colombo', '2026-11-22T19:00:00.000Z', '2026-11-22T19:00:00.000Z')
      `);
      await db.runAsync(`
        INSERT INTO reading_history (account_id, local_id, read_at)
        VALUES (2, 'apod_2', '2026-11-22T21:00:00.000Z')
      `);
    });

    const account1Result = await getTimelineItems({ accountId: 1 });
    expect(account1Result.items).toHaveLength(2);
    expect(account1Result.items.some(i => i.title === 'Account 1 Saturn')).toBe(true);
    expect(account1Result.items.some(i => i.title === 'Pillars of Creation')).toBe(true);
    expect(account1Result.items.some(i => i.title === 'Account 2 Jupiter')).toBe(false);

    const account2Result = await getTimelineItems({ accountId: 2 });
    expect(account2Result.items).toHaveLength(2);
    expect(account2Result.items.some(i => i.title === 'Account 2 Jupiter')).toBe(true);
    expect(account2Result.items.some(i => i.title === 'Veil Nebula')).toBe(true);
    expect(account2Result.items.some(i => i.title === 'Account 1 Saturn')).toBe(false);
  });

  it('determines deterministic tie-breaking when records share identical timestamps', async () => {
    const identicalTime = '2026-11-25T12:00:00.000Z';
    await writeDatabase(async db => {
      await db.runAsync('DELETE FROM observations WHERE account_id = 1');
      await db.runAsync('DELETE FROM favourites WHERE account_id = 1');

      // Observation and Favourite sharing the exact same timestamp
      await db.runAsync(`
        INSERT INTO observations (id, account_id, title, notes, observed_at, timezone, created_at, updated_at)
        VALUES ('obs_tie', 1, 'Tie Observation', 'Notes', ?, 'UTC', ?, ?)
      `, [identicalTime, identicalTime, identicalTime]);

      await db.runAsync(`
        INSERT INTO favourites (account_id, local_id, added_at)
        VALUES (1, 'apod_1', ?)
      `, [identicalTime]);
    });

    const result = await getTimelineItems({ accountId: 1 });
    expect(result.items).toHaveLength(2);

    // Stably ordered: 'discovery_saved' comes before 'observation' due to kind ASC ('discovery_saved' < 'observation')
    expect(result.items[0].kind).toBe('discovery_saved');
    expect(result.items[1].kind).toBe('observation');
  });

  it('preserves undated study bookmarks without fabricating timestamps and groups them at end', async () => {
    await writeDatabase(async db => {
      await db.runAsync('DELETE FROM study_bookmarks WHERE account = 1');
      await db.runAsync(`
        INSERT INTO study_bookmarks (account, entry_id, section_anchor, note)
        VALUES (1, 'study_kepler', '#kepler-laws', 'Review for exam')
      `);
    });

    const result = await getTimelineItems({ accountId: 1 });
    const studyItem = result.items.find(i => i.kind === 'study_bookmark');
    expect(studyItem).toBeDefined();
    expect(studyItem?.eventAt).toBeNull();
    expect(studyItem?.dateKind).toBe('undated');
    expect(studyItem?.title).toBe('Keplerian Orbits');
    expect(studyItem?.metadata?.note).toBe('Review for exam');

    // Last item in the list must be the undated item
    expect(result.items[result.items.length - 1].dateKind).toBe('undated');
  });

  it('immediately reflects edits and deletions from underlying tables without stale logs', async () => {
    await writeDatabase(async db => {
      await db.runAsync('DELETE FROM observations WHERE account_id = 1');
      await db.runAsync(`
        INSERT INTO observations (id, account_id, title, notes, observed_at, timezone, created_at, updated_at)
        VALUES ('obs_dynamic', 1, 'Original Title', 'Original Notes', '2026-11-20T10:00:00.000Z', 'UTC', '2026-11-20T10:00:00.000Z', '2026-11-20T10:00:00.000Z')
      `);
    });

    let res = await getTimelineItems({ accountId: 1, filter: 'observations' });
    expect(res.items[0].title).toBe('Original Title');

    // Edit the observation
    await writeDatabase(async db => {
      await db.runAsync('UPDATE observations SET title = ?, notes = ? WHERE id = ?', [
        'Updated Telescope Title',
        'Updated Notes',
        'obs_dynamic',
      ]);
    });

    res = await getTimelineItems({ accountId: 1, filter: 'observations' });
    expect(res.items[0].title).toBe('Updated Telescope Title');
    expect(res.items[0].summary).toBe('Updated Notes');

    // Delete the observation
    await writeDatabase(async db => {
      await db.runAsync('DELETE FROM observations WHERE id = ?', ['obs_dynamic']);
    });

    res = await getTimelineItems({ accountId: 1, filter: 'observations' });
    expect(res.items).toHaveLength(0);
  });

  it('supports cursor pagination across dated and undated items', async () => {
    await writeDatabase(async db => {
      await db.runAsync('DELETE FROM observations WHERE account_id = 1');
      await db.runAsync('DELETE FROM favourites WHERE account_id = 1');
      await db.runAsync('DELETE FROM study_bookmarks WHERE account = 1');

      // Add 3 dated observations + 1 undated study bookmark
      await db.runAsync(`
        INSERT INTO observations (id, account_id, title, notes, observed_at, timezone, created_at, updated_at)
        VALUES 
          ('obs_page_1', 1, 'Obs Page 1', 'N1', '2026-11-25T10:00:00.000Z', 'UTC', '2026-11-25T10:00:00.000Z', '2026-11-25T10:00:00.000Z'),
          ('obs_page_2', 1, 'Obs Page 2', 'N2', '2026-11-24T10:00:00.000Z', 'UTC', '2026-11-24T10:00:00.000Z', '2026-11-24T10:00:00.000Z'),
          ('obs_page_3', 1, 'Obs Page 3', 'N3', '2026-11-23T10:00:00.000Z', 'UTC', '2026-11-23T10:00:00.000Z', '2026-11-23T10:00:00.000Z')
      `);
      await db.runAsync(`
        INSERT INTO study_bookmarks (account, entry_id)
        VALUES (1, 'study_kepler')
      `);
    });

    // Page 1: limit 2
    const page1 = await getTimelineItems({ accountId: 1, limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0].title).toBe('Obs Page 1');
    expect(page1.items[1].title).toBe('Obs Page 2');
    expect(page1.nextCursor).not.toBeNull();

    // Page 2: with cursor
    const page2 = await getTimelineItems({ accountId: 1, limit: 2, cursor: page1.nextCursor });
    expect(page2.items).toHaveLength(2);
    expect(page2.items[0].title).toBe('Obs Page 3');
    expect(page2.items[1].title).toBe('Keplerian Orbits');
    expect(page2.nextCursor).toBeNull(); // No more items
  });

  it('supports kind filters', async () => {
    const obsOnly = await getTimelineItems({ accountId: 1, filter: 'observations' });
    expect(obsOnly.items.every(i => i.kind === 'observation')).toBe(true);

    const studyOnly = await getTimelineItems({ accountId: 1, filter: 'study' });
    expect(studyOnly.items.every(i => i.kind === 'study_bookmark')).toBe(true);
  });

  it('correctly encodes and decodes cursor tokens', () => {
    const raw = { eventAt: '2026-11-20T10:00:00.000Z', kind: 'observation', id: 'obs_123' };
    const token = encodeCursor(raw);
    expect(typeof token).toBe('string');
    const decoded = decodeCursor(token);
    expect(decoded).toEqual(raw);

    expect(decodeCursor('invalid-base64')).toBeNull();
  });
});
