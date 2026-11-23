import { createAsyncThunk } from '@reduxjs/toolkit';
import { Directory, File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { getDatabase, writeDatabase } from '../../database/db';
import { fetchJson } from '../../services/http';
import space from '../../../study-releases/observatories/1/space.json';
import ground from '../../../study-releases/observatories/1/ground.json';
import bundled from '../../../study-releases/manifest.json';
import { activatePack, manifestSchema, packEntries, packSize, type CatalogPack } from './packRepository';

const embeddedParts: Record<string, unknown> = { 'ground.json': ground, 'space.json': space };
export function shipsWithApp(pack: CatalogPack) {
  return pack.id === 'observatories' && pack.revision === 1;
}
const base = 'https://raw.githubusercontent.com/Suthankan1/cosmolog/main/study-releases/';
export async function readManifest() {
  const row = await (
    await getDatabase()
  ).getFirstAsync<{ value: string }>("SELECT value FROM study_meta WHERE key='study-manifest'");
  return manifestSchema.parse(row ? JSON.parse(row.value) : bundled);
}
export const refreshManifest = createAsyncThunk('study/manifest', async (_, { signal }) => {
  const now = Date.now();
  const due = await writeDatabase(async (db) => {
    const last = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM study_meta WHERE key='manifest-attempt'",
    );
    if (last && now - Number(last.value) >= 0 && now - Number(last.value) < 86400000) return false;
    await db.runAsync("INSERT OR REPLACE INTO study_meta VALUES ('manifest-attempt',?)", [String(now)]);
    return true;
  });
  if (due) {
    const latest = manifestSchema.parse(await fetchJson(base + 'manifest.json', { signal }));
    await writeDatabase((db) =>
      db.runAsync("INSERT OR REPLACE INTO study_meta VALUES ('study-manifest',?)", [JSON.stringify(latest)]),
    );
  }
  return readManifest();
});

export const downloadPack = createAsyncThunk(
  'study/download',
  async ({ pack, onProgress }: { pack: CatalogPack; onProgress: (done: number) => void }, { signal }) => {
    const dir = new Directory(Paths.document, 'study-staging', pack.id, String(pack.revision));
    dir.create({ idempotent: true, intermediates: true });
    if (Paths.availableDiskSpace < packSize(pack) * 3 + 1024 * 1024)
      throw Error('Insufficient free storage.');
    const entries: PackRows = [];
    for (const [index, part] of pack.parts.entries()) {
      const file = new File(dir, part.file);
      if (!file.exists || file.size !== part.bytes || file.md5 !== part.md5) {
        if (shipsWithApp(pack) && embeddedParts[part.file]) {
          file.create({ overwrite: true });
          file.write(JSON.stringify(embeddedParts[part.file]) + '\n');
        } else {
          const response = await fetch(base + pack.id + '/' + pack.revision + '/' + part.file, { signal });
          if (!response.ok || !response.body) throw Error('Pack download unavailable.');
          const reader = response.body.getReader();
          const bytes = new Uint8Array(part.bytes);
          let offset = 0;
          try {
            while (true) {
              const chunk = await reader.read();
              if (chunk.done) break;
              if (offset + chunk.value.length > bytes.length) throw Error('Pack part exceeds expected size.');
              bytes.set(chunk.value, offset);
              offset += chunk.value.length;
            }
          } finally {
            await reader.cancel().catch(() => undefined);
          }
          if (offset !== bytes.length) throw Error('Incomplete pack part.');
          file.create({ overwrite: true });
          file.write(bytes);
        }
      }
      if (file.size !== part.bytes || file.md5 !== part.md5) throw Error('Pack integrity check failed.');
      const rows = packEntries.parse(JSON.parse(await file.text()));
      if (rows.length !== part.count) throw Error('Unexpected number of study entries.');
      entries.push(...rows);
      onProgress(index + 1);
    }
    if (signal.aborted) throw Error('Download paused.');
    await activatePack(pack, entries);
    if (dir.exists) dir.delete();
  },
);
type PackRows = ReturnType<typeof packEntries.parse>;
