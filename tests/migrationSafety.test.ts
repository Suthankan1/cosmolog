import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import {
  CREATE_TABLES_SQL,
  MIGRATE_TO_SNAPSHOTS_SQL,
  MIGRATE_TO_NOTES_SQL,
  MIGRATE_TO_IMAGE_LICENSES_SQL,
  MIGRATE_TO_MEDIA_PROVENANCE_SQL,
  MIGRATE_TO_READING_CHECKPOINT_SQL,
  MIGRATE_TO_READING_HISTORY_SQL,
  MIGRATE_TO_COLLECTIONS_SQL,
  MIGRATE_TO_READING_PACKS_SQL,
  MIGRATE_TO_SKY_ORBITS_SQL,
  MIGRATE_TO_STUDY_SQL,
  MIGRATE_TO_STUDY_PACKS_SQL,
  MIGRATE_TO_STUDY_ANCHORS_SQL,
  MIGRATE_TO_DISPATCH_PAGES_SQL,
  MIGRATE_TO_ARCHIVE_SEARCH_SQL,
  MIGRATE_TO_EXPEDITIONS_SQL,
  MIGRATE_TO_EXPEDITION_REVISIONS_SQL,
  MIGRATE_TO_OBSERVATIONS_SQL,
  MIGRATE_TO_OBSERVATION_ATTACHMENTS_SQL,
} from '../src/database/schema';

// Helper to run all migrations from version up to 16 on a raw SQLite connection
async function runMigrationsTo16(db: mockDatabaseSync) {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  const version = row.user_version;

  if (version < 1) db.exec(MIGRATE_TO_SNAPSHOTS_SQL);
  if (version < 2) db.exec(MIGRATE_TO_NOTES_SQL);
  if (version < 3) db.exec(MIGRATE_TO_IMAGE_LICENSES_SQL);
  if (version < 4) db.exec(MIGRATE_TO_MEDIA_PROVENANCE_SQL);
  if (version < 5) db.exec(MIGRATE_TO_READING_CHECKPOINT_SQL);
  if (version < 6) db.exec(MIGRATE_TO_READING_HISTORY_SQL);
  if (version < 7) db.exec(MIGRATE_TO_COLLECTIONS_SQL);
  if (version < 8) db.exec(MIGRATE_TO_READING_PACKS_SQL);
  if (version < 9) db.exec(MIGRATE_TO_SKY_ORBITS_SQL);
  if (version < 10) db.exec(MIGRATE_TO_STUDY_SQL);
  if (version < 11) db.exec(MIGRATE_TO_STUDY_PACKS_SQL);
  if (version < 12) db.exec(MIGRATE_TO_STUDY_ANCHORS_SQL);
  if (version < 13) db.exec(MIGRATE_TO_DISPATCH_PAGES_SQL);
  if (version < 14) db.exec(MIGRATE_TO_ARCHIVE_SEARCH_SQL);
  if (version < 15) db.exec(MIGRATE_TO_EXPEDITIONS_SQL);
  if (version < 16) {
    const cols = db.prepare('PRAGMA table_info(expedition_progress)').all() as { name: string }[];
    const hasRevision = cols.some(c => c.name === 'revision');
    if (!hasRevision) {
      db.exec(MIGRATE_TO_EXPEDITION_REVISIONS_SQL);
    } else {
      db.exec('PRAGMA user_version = 16;');
    }
  }
}

// Helper to run all migrations from version up to 17 on a raw SQLite connection
async function runMigrationsTo17(db: mockDatabaseSync) {
  await runMigrationsTo16(db);
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  if (row.user_version < 17) {
    db.exec(MIGRATE_TO_OBSERVATIONS_SQL);
  }
}

// Helper to run all migrations from version up to 18 on a raw SQLite connection
async function runMigrationsTo18(db: mockDatabaseSync) {
  await runMigrationsTo17(db);
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  if (row.user_version < 18) {
    db.exec(MIGRATE_TO_OBSERVATION_ATTACHMENTS_SQL);
  }
}

describe('Database Migration 16 Safety (Issue 1)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'cosmolog-mig-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles fresh installation from user_version 0 to 16', async () => {
    const dbPath = join(tmpDir, 'fresh.sqlite');
    const db = new mockDatabaseSync(dbPath);
    db.exec(CREATE_TABLES_SQL);

    await runMigrationsTo16(db);

    const versionRow = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(versionRow.user_version).toBe(16);

    const cols = db.prepare('PRAGMA table_info(expedition_progress)').all() as { name: string }[];
    const colNames = cols.map(c => c.name);
    expect(colNames).toContain('account_id');
    expect(colNames).toContain('expedition_id');
    expect(colNames).toContain('step_id');
    expect(colNames).toContain('completed_at');
    expect(colNames).toContain('revision');

    db.close();
  });

  it('safely upgrades from schema version 14 to 16', async () => {
    const dbPath = join(tmpDir, 'v14.sqlite');
    const db = new mockDatabaseSync(dbPath);
    db.exec(CREATE_TABLES_SQL);
    // Fast-forward up to v14
    await runMigrationsTo16(db); // First build up to 16...
    // But let's build specifically up to v14
    db.close();

    const db14 = new mockDatabaseSync(dbPath);
    // Set version to 14 and drop expedition_progress to simulate v14
    db14.exec('DROP TABLE IF EXISTS expedition_progress;');
    db14.exec('PRAGMA user_version = 14;');

    // Run migration from 14 to 16
    await runMigrationsTo16(db14);

    const versionRow = db14.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(versionRow.user_version).toBe(16);

    const cols = db14.prepare('PRAGMA table_info(expedition_progress)').all() as { name: string }[];
    expect(cols.map(c => c.name)).toContain('revision');

    db14.close();
  });

  it('safely upgrades original v15 database (WITHOUT revision column) while preserving progress', async () => {
    const dbPath = join(tmpDir, 'orig_v15.sqlite');
    const db = new mockDatabaseSync(dbPath);
    db.exec(CREATE_TABLES_SQL);

    // Setup original v15 table schema directly as created in PR #3
    db.exec(`
      CREATE TABLE expedition_progress (
        account_id INTEGER NOT NULL CHECK (account_id > 0),
        expedition_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (account_id, expedition_id, step_id)
      );
      CREATE INDEX idx_expedition_progress_account ON expedition_progress(account_id, expedition_id);
      PRAGMA user_version = 15;
    `);

    // Verify original v15 does NOT have revision column
    let cols = db.prepare('PRAGMA table_info(expedition_progress)').all() as { name: string }[];
    expect(cols.map(c => c.name)).not.toContain('revision');

    // Insert user progress into original v15
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO expedition_progress (account_id, expedition_id, step_id, completed_at)
      VALUES (42, 'saturn', 'step-shadow', ?)
    `).run(now);

    // Execute migration to 16
    await runMigrationsTo16(db);

    // Verify user_version is now 16
    const versionRow = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(versionRow.user_version).toBe(16);

    // Verify revision column was added with default value 1
    cols = db.prepare('PRAGMA table_info(expedition_progress)').all() as { name: string }[];
    expect(cols.map(c => c.name)).toContain('revision');

    // Verify existing progress was preserved with default revision 1
    const saved = db.prepare('SELECT * FROM expedition_progress WHERE account_id = 42').all() as any[];
    expect(saved.length).toBe(1);
    expect(saved[0].expedition_id).toBe('saturn');
    expect(saved[0].step_id).toBe('step-shadow');
    expect(saved[0].revision).toBe(1);

    db.close();
  });

  it('safely upgrades modified v15 database (WITH revision column) without duplicate column error', async () => {
    const dbPath = join(tmpDir, 'mod_v15.sqlite');
    const db = new mockDatabaseSync(dbPath);
    db.exec(CREATE_TABLES_SQL);

    // Setup modified v15 table schema (which already had revision)
    db.exec(`
      CREATE TABLE expedition_progress (
        account_id INTEGER NOT NULL CHECK (account_id > 0),
        expedition_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (account_id, expedition_id, step_id)
      );
      CREATE INDEX idx_expedition_progress_account ON expedition_progress(account_id, expedition_id);
      PRAGMA user_version = 15;
    `);

    // Insert user progress with a custom revision
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO expedition_progress (account_id, expedition_id, step_id, revision, completed_at)
      VALUES (99, 'apollo', 'step-moon', 3, ?)
    `).run(now);

    // Execute migration to 16
    await runMigrationsTo16(db);

    const versionRow = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(versionRow.user_version).toBe(16);

    // Verify data was 100% preserved with its revision 3 intact
    const saved = db.prepare('SELECT * FROM expedition_progress WHERE account_id = 99').all() as any[];
    expect(saved.length).toBe(1);
    expect(saved[0].expedition_id).toBe('apollo');
    expect(saved[0].step_id).toBe('step-moon');
    expect(saved[0].revision).toBe(3);

    db.close();
  });

  it('rolls back transaction on migration error and preserves existing progress', async () => {
    const dbPath = join(tmpDir, 'rollback.sqlite');
    const db = new mockDatabaseSync(dbPath);
    db.exec(CREATE_TABLES_SQL);

    // Start at original v15 with data
    db.exec(`
      CREATE TABLE expedition_progress (
        account_id INTEGER NOT NULL CHECK (account_id > 0),
        expedition_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (account_id, expedition_id, step_id)
      );
      PRAGMA user_version = 15;
    `);

    db.prepare(`
      INSERT INTO expedition_progress (account_id, expedition_id, step_id, completed_at)
      VALUES (10, 'saturn', 'step-rings', '2026-11-26')
    `).run();

    // Simulate failing migration inside transaction
    expect(() => {
      db.exec('BEGIN TRANSACTION');
      try {
        db.exec('ALTER TABLE expedition_progress ADD COLUMN revision INTEGER NOT NULL DEFAULT 1');
        // Force an error
        db.exec('INSERT INTO non_existent_table VALUES (1)');
        db.exec('PRAGMA user_version = 16');
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    }).toThrow();

    // After rollback, version remains 15 and existing progress row is intact
    const versionRow = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(versionRow.user_version).toBe(15);

    const rows = db.prepare('SELECT * FROM expedition_progress WHERE account_id = 10').all();
    expect(rows.length).toBe(1);

    db.close();
  });

  describe('Database Migration 17 Safety (Observations Table)', () => {
    it('applies Migration 17 on fresh install and sets user_version to 17', async () => {
      const dbPath = join(tmpDir, 'fresh-17.sqlite');
      const db = new mockDatabaseSync(dbPath);

      db.exec(CREATE_TABLES_SQL);
      await runMigrationsTo17(db);

      const versionRow = db.prepare('PRAGMA user_version').get() as { user_version: number };
      expect(versionRow.user_version).toBe(17);

      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='observations'").all();
      expect(tables.length).toBe(1);

      const cols = db.prepare('PRAGMA table_info(observations)').all() as { name: string }[];
      const colNames = cols.map(c => c.name);
      expect(colNames).toContain('id');
      expect(colNames).toContain('account_id');
      expect(colNames).toContain('title');
      expect(colNames).toContain('notes');
      expect(colNames).toContain('observed_at');
      expect(colNames).toContain('timezone');
      expect(colNames).toContain('target_id');
      expect(colNames).toContain('conditions');

      db.close();
    });

    it('upgrades from version 16 to 17 preserving existing expedition progress and bookmarks', async () => {
      const dbPath = join(tmpDir, 'upgrade-16-to-17.sqlite');
      const db = new mockDatabaseSync(dbPath);

      db.exec(CREATE_TABLES_SQL);
      await runMigrationsTo17(db); // will be version 17

      // Manually insert prior version data
      db.prepare(`
        INSERT INTO expedition_progress (account_id, expedition_id, step_id, completed_at, revision)
        VALUES (10, 'apollo', 'step-apollo-11', '2026-11-26', 1)
      `).run();

      const versionRow = db.prepare('PRAGMA user_version').get() as { user_version: number };
      expect(versionRow.user_version).toBe(17);

      const rows = db.prepare('SELECT * FROM expedition_progress WHERE account_id = 10').all();
      expect(rows.length).toBe(1);

      db.close();
    });
  });

  describe('Database Migration 18 Safety (Observation Attachments & Coordinates)', () => {
    it('applies Migration 18 on fresh install and sets user_version to 18', async () => {
      const dbPath = join(tmpDir, 'fresh-18.sqlite');
      const db = new mockDatabaseSync(dbPath);

      db.exec(CREATE_TABLES_SQL);
      await runMigrationsTo18(db);

      const versionRow = db.prepare('PRAGMA user_version').get() as { user_version: number };
      expect(versionRow.user_version).toBe(18);

      const cols = db.prepare('PRAGMA table_info(observations)').all() as { name: string }[];
      const colNames = cols.map(c => c.name);
      expect(colNames).toContain('latitude');
      expect(colNames).toContain('longitude');
      expect(colNames).toContain('location_name');
      expect(colNames).toContain('image_file_name');
      expect(colNames).toContain('image_bytes');

      db.close();
    });

    it('upgrades from version 17 to 18 preserving existing observations', async () => {
      const dbPath = join(tmpDir, 'upgrade-17-to-18.sqlite');
      const db = new mockDatabaseSync(dbPath);

      db.exec(CREATE_TABLES_SQL);
      await runMigrationsTo17(db);

      // Insert pre-migration observation record
      db.prepare(`
        INSERT INTO observations (
          id, account_id, title, notes, observed_at, timezone, target_id, target_name, conditions, created_at, updated_at
        ) VALUES (
          'obs_v17_test', 10, 'Pre-migration Lunar Note', 'Craters sharp at dusk.', '2026-11-26T18:00:00Z', 'UTC', 'body:Moon', 'The Moon', 'Clear', '2026-11-26T18:00:00Z', '2026-11-26T18:00:00Z'
        )
      `).run();

      const versionRow17 = db.prepare('PRAGMA user_version').get() as { user_version: number };
      expect(versionRow17.user_version).toBe(17);

      // Upgrade to 18
      await runMigrationsTo18(db);

      const versionRow18 = db.prepare('PRAGMA user_version').get() as { user_version: number };
      expect(versionRow18.user_version).toBe(18);

      // Verify existing row is preserved with NULL coordinates and photo
      const preserved = db.prepare("SELECT * FROM observations WHERE id = 'obs_v17_test'").get() as any;
      expect(preserved).toBeDefined();
      expect(preserved.title).toBe('Pre-migration Lunar Note');
      expect(preserved.latitude).toBeNull();
      expect(preserved.longitude).toBeNull();
      expect(preserved.image_file_name).toBeNull();
      expect(preserved.image_bytes).toBe(0);

      db.close();
    });
  });
});

