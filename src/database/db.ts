import { mapRowToDiscoveryItem, type CachedItemRow } from './models';
import { searchFields } from './searchText';
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, MIGRATE_TO_ARCHIVE_SEARCH_SQL, MIGRATE_TO_DISPATCH_PAGES_SQL, MIGRATE_TO_SNAPSHOTS_SQL, MIGRATE_TO_NOTES_SQL, MIGRATE_TO_IMAGE_LICENSES_SQL,
  MIGRATE_TO_MEDIA_PROVENANCE_SQL, MIGRATE_TO_READING_CHECKPOINT_SQL, MIGRATE_TO_READING_HISTORY_SQL,
  MIGRATE_TO_COLLECTIONS_SQL, MIGRATE_TO_READING_PACKS_SQL, MIGRATE_TO_SKY_ORBITS_SQL, MIGRATE_TO_STUDY_SQL, MIGRATE_TO_STUDY_PACKS_SQL, MIGRATE_TO_STUDY_ANCHORS_SQL, MIGRATE_TO_EXPEDITIONS_SQL,
  MIGRATE_TO_EXPEDITION_REVISIONS_SQL, MIGRATE_TO_OBSERVATIONS_SQL, MIGRATE_TO_OBSERVATION_ATTACHMENTS_SQL,
  MIGRATE_TO_INSTRUMENT_SNAPSHOT_SQL } from './schema';

const DATABASE_NAME = 'cosmolog.db';

async function openDatabase() {
  const writer = await SQLite.openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
  try {
    await writer.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await writer.withTransactionAsync(async () => {
      const { user_version: version } = (await writer.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))!;
      if (version > 19) throw new Error('Unsupported database version');
      if (version === 0) {
        await writer.execAsync(CREATE_TABLES_SQL);
        await writer.execAsync(MIGRATE_TO_SNAPSHOTS_SQL);
      }
      if (version < 2) await writer.execAsync(MIGRATE_TO_NOTES_SQL);
      if (version < 3) await writer.execAsync(MIGRATE_TO_IMAGE_LICENSES_SQL);
      if (version < 4) await writer.execAsync(MIGRATE_TO_MEDIA_PROVENANCE_SQL);
      if (version < 5) await writer.execAsync(MIGRATE_TO_READING_CHECKPOINT_SQL);
      if (version < 6) await writer.execAsync(MIGRATE_TO_READING_HISTORY_SQL);
      if (version < 7) await writer.execAsync(MIGRATE_TO_COLLECTIONS_SQL);
      if (version < 8) await writer.execAsync(MIGRATE_TO_READING_PACKS_SQL);
      if (version < 9) await writer.execAsync(MIGRATE_TO_SKY_ORBITS_SQL);
      if (version < 10) await writer.execAsync(MIGRATE_TO_STUDY_SQL);
      if (version < 11) await writer.execAsync(MIGRATE_TO_STUDY_PACKS_SQL);
      if (version < 12) await writer.execAsync(MIGRATE_TO_STUDY_ANCHORS_SQL);
      if (version < 13) await writer.execAsync(MIGRATE_TO_DISPATCH_PAGES_SQL);
      if (version < 14) {
        await writer.execAsync(MIGRATE_TO_ARCHIVE_SEARCH_SQL);
        let after = '';
        for (;;) {
          const rows = await writer.getAllAsync<CachedItemRow>('SELECT * FROM cached_items WHERE local_id > ? ORDER BY local_id LIMIT 100', [after]);
          for (const row of rows) await writer.runAsync('UPDATE cached_items SET search_title=?, search_text=? WHERE local_id=?',
            [...searchFields(mapRowToDiscoveryItem(row)), row.local_id]);
          if (rows.length < 100) break;
          after = rows[rows.length - 1].local_id;
        }
      }
      if (version < 15) await writer.execAsync(MIGRATE_TO_EXPEDITIONS_SQL);
      if (version < 16) {
        const cols = await writer.getAllAsync<{ name: string }>('PRAGMA table_info(expedition_progress)');
        const hasRevision = cols.some(c => c.name === 'revision');
        if (!hasRevision) {
          await writer.execAsync(MIGRATE_TO_EXPEDITION_REVISIONS_SQL);
        } else {
          await writer.execAsync('PRAGMA user_version = 16;');
        }
      }
      if (version < 17) await writer.execAsync(MIGRATE_TO_OBSERVATIONS_SQL);
      if (version < 18) await writer.execAsync(MIGRATE_TO_OBSERVATION_ATTACHMENTS_SQL);
      if (version < 19) await writer.execAsync(MIGRATE_TO_INSTRUMENT_SNAPSHOT_SQL);
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
