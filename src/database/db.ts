import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, MIGRATE_TO_SNAPSHOTS_SQL, MIGRATE_TO_NOTES_SQL, MIGRATE_TO_IMAGE_LICENSES_SQL,
  MIGRATE_TO_MEDIA_PROVENANCE_SQL, MIGRATE_TO_READING_CHECKPOINT_SQL, MIGRATE_TO_READING_HISTORY_SQL } from './schema';

const DATABASE_NAME = 'cosmolog.db';

async function openDatabase() {
  const writer = await SQLite.openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
  try {
    await writer.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await writer.withTransactionAsync(async () => {
      const { user_version: version } = (await writer.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))!;
      if (version > 6) throw new Error('Unsupported database version');
      if (version === 0) {
        await writer.execAsync(CREATE_TABLES_SQL);
        await writer.execAsync(MIGRATE_TO_SNAPSHOTS_SQL);
      }
      if (version < 2) await writer.execAsync(MIGRATE_TO_NOTES_SQL);
      if (version < 3) await writer.execAsync(MIGRATE_TO_IMAGE_LICENSES_SQL);
      if (version < 4) await writer.execAsync(MIGRATE_TO_MEDIA_PROVENANCE_SQL);
      if (version < 5) await writer.execAsync(MIGRATE_TO_READING_CHECKPOINT_SQL);
      if (version < 6) await writer.execAsync(MIGRATE_TO_READING_HISTORY_SQL);
    });
    const reader = await SQLite.openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
    return { reader, writer };
  } catch (error) {
    await writer.closeAsync();
    throw error;
  }
}

let connection: ReturnType<typeof openDatabase> | undefined;
let writeQueue: Promise<unknown> = Promise.resolve();

function getConnections() {
  connection ??= openDatabase().catch(error => {
    connection = undefined;
    throw error;
  });
  return connection;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return (await getConnections()).reader;
}

export function writeDatabase<T>(operation: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const result = writeQueue.then(async () => {
    const { writer } = await getConnections();
    const output: { value?: T } = {};
    await writer.withTransactionAsync(async () => {
      output.value = await operation(writer);
    });
    return output.value as T;
  });
  writeQueue = result.catch(() => undefined);
  return result;
}
