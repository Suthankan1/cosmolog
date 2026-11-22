import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('cosmolog.db');
    await db.execAsync(CREATE_TABLES_SQL);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

/**
 * Resets database instance for testing.
 */
export function resetDatabaseInstance(): void {
  dbInstance = null;
  initPromise = null;
}
