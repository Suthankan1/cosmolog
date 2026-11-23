import { getDatabase, writeDatabase } from '../db';
import { getLocalImage } from '../../services/storage/imageStorage';
import { mayDownloadImage } from '../../services/api/mediaPolicy';
import type { CachedItemRow } from '../models';

export type MediaStatus = 'ready' | 'previous' | 'waiting' | 'failed' | 'text-only';

export interface SavedMediaRow extends Pick<CachedItemRow, 'source' | 'attribution' | 'image_remote_url' | 'image_license_url'> {
  status: Exclude<MediaStatus, 'text-only'> | null;
  file_name: string | null;
  source_url: string | null;
  license_url: string | null;
}

export function mapSavedMedia(row: SavedMediaRow) {
  const eligible = mayDownloadImage(row.source, row.image_remote_url, row.attribution, row.image_license_url);
  const image = eligible && row.license_url === row.image_license_url &&
    mayDownloadImage(row.source, row.source_url, row.attribution, row.license_url) ? getLocalImage(row.file_name) : null;
  const mediaStatus: MediaStatus = eligible
    ? image ? (row.source_url === row.image_remote_url ? 'ready' : 'previous') : row.status === 'failed' ? 'failed' : 'waiting'
    : 'text-only';
  return { imageLocalUri: image?.uri ?? null, imageBytes: image?.bytes ?? 0, mediaStatus };
}

export async function getOfflineMedia(accountId: number, localId: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SavedMediaRow>(
    `SELECT c.source, c.attribution, c.image_remote_url, c.image_license_url, m.status, m.file_name, m.source_url, m.license_url
     FROM cached_items c LEFT JOIN saved_media m ON m.local_id = c.local_id
     WHERE c.local_id = ? AND EXISTS (
       SELECT 1 FROM offline_item_owners WHERE account_id = ? AND local_id = c.local_id
     )`, [localId, accountId],
  );
  return row ? mapSavedMedia(row) : null;
}

export async function reconcileSavedImages(): Promise<Set<string>> {
  return writeDatabase(async db => {
    const rows = await db.getAllAsync<{
      local_id: string; source: string; attribution: string | null;
      image_remote_url: string | null; image_license_url: string | null; file_name: string | null; status: string | null;
    }>(
      `SELECT c.local_id, c.source, c.attribution, c.image_remote_url, c.image_license_url, m.file_name, m.status
       FROM cached_items c LEFT JOIN saved_media m ON m.local_id = c.local_id
       WHERE EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id)`,
    );
    await db.runAsync('DELETE FROM saved_media WHERE NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = saved_media.local_id)');
    const retained = new Set<string>();
    for (const row of rows) {
      if (!mayDownloadImage(row.source, row.image_remote_url, row.attribution, row.image_license_url)) {
        // Keep files from earlier versions until refreshed metadata establishes eligibility.
        if (row.file_name && getLocalImage(row.file_name)) retained.add(row.file_name);
        continue;
      }
      if (row.file_name && getLocalImage(row.file_name)) {
        retained.add(row.file_name);
        continue;
      }
      if (!row.status || row.status === 'ready') {
        await db.runAsync(
          `INSERT INTO saved_media (local_id, status) VALUES (?, 'waiting')
           ON CONFLICT(local_id) DO UPDATE SET status = 'waiting', file_name = NULL, bytes = 0`,
          [row.local_id],
        );
      }
    }
    return retained;
  });
}

export async function getPendingImages(accountId: number) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    local_id: string; image_remote_url: string; source: string; attribution: string | null; image_license_url: string | null;
  }>(
    `SELECT c.local_id, c.image_remote_url, c.source, c.attribution, c.image_license_url FROM saved_media m
     JOIN cached_items c ON c.local_id = m.local_id
     JOIN (SELECT local_id, MAX(added_at) AS added_at FROM offline_item_owners WHERE account_id = ? GROUP BY local_id) owners
       ON owners.local_id = c.local_id
     WHERE (m.status IN ('waiting', 'failed') OR m.source_url IS NOT c.image_remote_url OR m.license_url IS NOT c.image_license_url)
       AND c.image_remote_url IS NOT NULL
     ORDER BY owners.added_at DESC, c.local_id`,
    [accountId],
  );
  return rows.filter(row => mayDownloadImage(row.source, row.image_remote_url, row.attribution, row.image_license_url));
}

export async function finishImage(
  localId: string, sourceUrl: string, image: { fileName: string; bytes: number } | null, licenseUrl: string | null = null,
) {
  return writeDatabase(async db => {
    const result = await db.runAsync(
      `UPDATE saved_media SET status = ?,
       file_name = COALESCE(?, file_name), bytes = COALESCE(?, bytes),
       source_url = CASE WHEN ? = 'ready' THEN ? ELSE source_url END,
       license_url = CASE WHEN ? = 'ready' THEN ? ELSE license_url END
       WHERE local_id = ? AND EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = saved_media.local_id)
       AND EXISTS (SELECT 1 FROM cached_items WHERE local_id = ? AND image_remote_url = ? AND image_license_url IS ?)`,
      [image ? 'ready' : 'failed', image?.fileName ?? null, image?.bytes ?? null,
       image ? 'ready' : 'failed', sourceUrl, image ? 'ready' : 'failed', licenseUrl, localId, localId, sourceUrl, licenseUrl],
    );
    return result.changes > 0;
  });
}

export async function invalidateSavedImage(localId: string, uri: string) {
  await writeDatabase(async db => {
    const row = await db.getFirstAsync<{ file_name: string | null }>(
      'SELECT file_name FROM saved_media WHERE local_id = ?', [localId],
    );
    if (row?.file_name && uri.endsWith('/' + row.file_name)) {
      await db.runAsync(
        "UPDATE saved_media SET status = 'failed', file_name = NULL, bytes = 0 WHERE local_id = ?",
        [localId],
      );
    }
  });
}
