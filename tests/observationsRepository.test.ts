import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import { CREATE_TABLES_SQL } from '../src/database/schema';
import { writeDatabase } from '../src/database/db';
import {
  createObservation,
  getObservations,
  getObservationById,
  updateObservation,
  deleteObservation,
  validateObservationInput,
} from '../src/database/repositories/observationsRepository';

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

const dir = mkdtempSync(join(tmpdir(), 'cosmolog-obs-repo-'));
beforeAll(() => {
  mockDatabasePath = join(dir, 'observations.sqlite');
  const legacy = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: true });
  legacy.exec(CREATE_TABLES_SQL);
  legacy.close();
});

afterAll(() => {
  for (const conn of mockOpenConnections) {
    try {
      conn.close();
    } catch {
      // already closed
    }
  }
  rmSync(dir, { recursive: true, force: true });
});

describe('Observations Repository & Migration 17 (F05)', () => {
  it('validates observation input parameters', () => {
    expect(() => validateObservationInput(0, 'Moon', 'Notes')).toThrow('account ID is required');
    expect(() => validateObservationInput(10, '', 'Notes')).toThrow('title is required');
    expect(() => validateObservationInput(10, 'A'.repeat(201), 'Notes')).toThrow('title exceeds');
    expect(() => validateObservationInput(10, 'Moon', '')).toThrow('notes are required');
    expect(() => validateObservationInput(10, 'Moon', 'B'.repeat(5001))).toThrow('notes exceed');
    expect(() => validateObservationInput(10, 'Moon', 'Notes', 'invalid-date')).toThrow('valid ISO date string');
    expect(() => validateObservationInput(10, 'Moon', 'Notes', '2026-11-26T20:00:00.000Z')).not.toThrow();
  });

  it('creates an observation for account 10 and retrieves it', async () => {
    const obs = await createObservation(
      10,
      {
        title: 'Lunar Terminator Observation',
        notes: 'Observed crater Tycho with 8-inch Dobsonian. Shadow lengths show dramatic relief.',
        observedAt: '2026-11-26T18:30:00.000Z',
        timezone: 'Asia/Colombo',
        targetId: 'body:Moon',
        targetName: 'The Moon',
        conditions: 'Clear sky, Bortle 4, good seeing',
      },
      () => '2026-11-26T18:35:00.000Z',
    );

    expect(obs.id).toMatch(/^obs_/);
    expect(obs.accountId).toBe(10);
    expect(obs.title).toBe('Lunar Terminator Observation');
    expect(obs.targetId).toBe('body:Moon');
    expect(obs.conditions).toBe('Clear sky, Bortle 4, good seeing');
    expect(obs.createdAt).toBe('2026-11-26T18:35:00.000Z');

    const retrieved = await getObservationById(10, obs.id);
    expect(retrieved).toEqual(obs);
  });

  it('enforces strict account isolation between user 10 and user 20', async () => {
    // User 10 has 1 observation
    const list10 = await getObservations(10);
    expect(list10.length).toBe(1);

    // User 20 should have 0 observations
    const list20 = await getObservations(20);
    expect(list20).toEqual([]);

    // User 20 cannot retrieve user 10's observation
    const unauthorizedRead = await getObservationById(20, list10[0].id);
    expect(unauthorizedRead).toBeNull();

    // User 20 cannot update user 10's observation
    const unauthorizedUpdate = await updateObservation(20, list10[0].id, { title: 'Hacked' });
    expect(unauthorizedUpdate).toBeNull();

    // User 20 cannot delete user 10's observation
    const unauthorizedDelete = await deleteObservation(20, list10[0].id);
    expect(unauthorizedDelete).toBe(false);

    // Observation remains untouched for User 10
    const verified = await getObservationById(10, list10[0].id);
    expect(verified?.title).toBe('Lunar Terminator Observation');
  });

  it('orders observations with newest observed_at date first', async () => {
    // Add older observation
    await createObservation(10, {
      title: 'Older Jupiter Observation',
      notes: 'Great Red Spot visible.',
      observedAt: '2026-11-20T19:00:00.000Z',
    });

    // Add newer observation
    await createObservation(10, {
      title: 'Newer Saturn Rings Observation',
      notes: 'Cassini division sharp.',
      observedAt: '2026-11-26T21:00:00.000Z',
    });

    const list = await getObservations(10);
    expect(list.length).toBe(3);
    expect(list[0].title).toBe('Newer Saturn Rings Observation');
    expect(list[1].title).toBe('Lunar Terminator Observation');
    expect(list[2].title).toBe('Older Jupiter Observation');
  });

  it('updates an observation for the owning account', async () => {
    const list = await getObservations(10);
    const target = list[0];

    const updated = await updateObservation(
      10,
      target.id,
      {
        notes: 'Updated: Ring tilt angle estimated at 15 degrees.',
        conditions: 'Wind picked up, seeing degraded to fair',
      },
      () => '2026-11-26T22:00:00.000Z',
    );

    expect(updated).toBeDefined();
    expect(updated?.notes).toBe('Updated: Ring tilt angle estimated at 15 degrees.');
    expect(updated?.conditions).toBe('Wind picked up, seeing degraded to fair');
    expect(updated?.updatedAt).toBe('2026-11-26T22:00:00.000Z');

    const retrieved = await getObservationById(10, target.id);
    expect(retrieved?.notes).toBe('Updated: Ring tilt angle estimated at 15 degrees.');
  });

  it('deletes an observation and verifies removal', async () => {
    const list = await getObservations(10);
    const target = list[list.length - 1]; // oldest

    const deleted = await deleteObservation(10, target.id);
    expect(deleted).toBe(true);

    const postList = await getObservations(10);
    expect(postList.length).toBe(list.length - 1);
    expect(postList.some(o => o.id === target.id)).toBe(false);
  });

  it('preserves observation if a linked discovery plate is removed from cache (ON DELETE SET NULL)', async () => {
    // Insert a test cached item
    await writeDatabase(async writer => {
      await writer.runAsync(
        `INSERT OR IGNORE INTO cached_items (
          local_id, source, external_id, title, summary, body, media_type, fetched_at, updated_at
        ) VALUES ('apod:test-plate', 'nasa-apod', 'test-plate', 'Test Plate', 'Summary', 'Body', 'image', '2026-11-26T12:00:00Z', '2026-11-26T12:00:00Z')`,
      );
    });

    // Create an observation linked to this plate
    const obs = await createObservation(10, {
      title: 'Observation with Plate Link',
      notes: 'Compared eyepiece view with APOD plate.',
      linkedDiscoveryId: 'apod:test-plate',
    });

    expect(obs.linkedDiscoveryId).toBe('apod:test-plate');

    // Delete the cached item (simulating cache cleaning or feed pruning)
    await writeDatabase(async writer => {
      await writer.runAsync("DELETE FROM cached_items WHERE local_id = 'apod:test-plate'");
    });

    // Observation must STILL EXIST, with linkedDiscoveryId set to NULL
    const survived = await getObservationById(10, obs.id);
    expect(survived).toBeDefined();
    expect(survived?.title).toBe('Observation with Plate Link');
    expect(survived?.linkedDiscoveryId).toBeNull();
  });
});
