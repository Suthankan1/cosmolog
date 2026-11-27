import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import {
  getReaderPreferences,
  setThemePreference,
  setSpeechRatePreference,
} from '../src/database/repositories/preferencesRepository';

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

const dir = mkdtempSync(join(tmpdir(), 'cosmolog-prefs-test-'));

beforeAll(() => {
  mockDatabasePath = join(dir, 'test-prefs.sqlite');
  const initDb = new mockDatabaseSync(mockDatabasePath);
  initDb.exec(`
    PRAGMA user_version = 20;
    CREATE TABLE reader_preferences (
      account_id INTEGER PRIMARY KEY CHECK (account_id > 0),
      theme TEXT NOT NULL DEFAULT 'editorial' CHECK (theme IN ('editorial', 'night')),
      speech_rate REAL NOT NULL DEFAULT 1.0,
      voice_id TEXT,
      updated_at TEXT NOT NULL
    );
  `);
  initDb.close();
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

describe('preferencesRepository (F12 Reader Preferences)', () => {

  it('returns default editorial preferences when no record exists for account', async () => {
    const prefs = await getReaderPreferences(101);
    expect(prefs.accountId).toBe(101);
    expect(prefs.theme).toBe('editorial');
    expect(prefs.speechRate).toBe(1.0);
    expect(prefs.voiceId).toBeNull();
  });

  it('returns default preferences for invalid or unauthenticated account id <= 0', async () => {
    const prefs = await getReaderPreferences(0);
    expect(prefs.accountId).toBe(0);
    expect(prefs.theme).toBe('editorial');
    expect(prefs.speechRate).toBe(1.0);
  });

  it('sets and persists night theme preference for an account', async () => {
    await setThemePreference(101, 'night');
    const prefs = await getReaderPreferences(101);
    expect(prefs.accountId).toBe(101);
    expect(prefs.theme).toBe('night');
    expect(prefs.updatedAt).toBeTruthy();
  });

  it('toggles back to editorial theme preference', async () => {
    await setThemePreference(101, 'night');
    expect((await getReaderPreferences(101)).theme).toBe('night');

    await setThemePreference(101, 'editorial');
    expect((await getReaderPreferences(101)).theme).toBe('editorial');
  });

  it('sets and updates speech rate preference without resetting theme', async () => {
    await setThemePreference(101, 'night');
    await setSpeechRatePreference(101, 1.25);

    const prefs = await getReaderPreferences(101);
    expect(prefs.speechRate).toBeCloseTo(1.25);
    expect(prefs.theme).toBe('night');
  });

  it('maintains strict account isolation between different user accounts', async () => {
    await setThemePreference(101, 'night');
    await setSpeechRatePreference(101, 1.5);

    await setThemePreference(202, 'editorial');
    await setSpeechRatePreference(202, 0.8);

    const user1Prefs = await getReaderPreferences(101);
    const user2Prefs = await getReaderPreferences(202);

    expect(user1Prefs.theme).toBe('night');
    expect(user1Prefs.speechRate).toBeCloseTo(1.5);

    expect(user2Prefs.theme).toBe('editorial');
    expect(user2Prefs.speechRate).toBeCloseTo(0.8);
  });
});
