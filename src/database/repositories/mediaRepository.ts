import { getDatabase, writeDatabase } from '../db';
import { getLocalImage } from '../../services/storage/imageStorage';
import { mayDownloadImage } from '../../services/api/mediaPolicy';

export async function reconcileSavedImages(): Promise<Set<string>> {
  return writeDatabase(async db => {
    const rows = await db.getAllAsync<{
      local_id: string; source: string; attribution: string | null;
      image_remote_url: string | null; image_license_url: string | null; file_name: string | null; status: string | null;
    }>(
      `SELECT c.local_id, c.source, c.attribution, c.image_remote_url, c.image_license_url, m.file_name, m.status
       FROM cached_items c LEFT JOIN saved_media m ON m.local_id = c.local_id
       WHERE EXISTS (SELECT 1 FROM favourites WHERE local_id = c.local_id)`,
    );
    await db.runAsync('DELETE FROM saved_media WHERE local_id NOT IN (SELECT local_id FROM favourites)');
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
     JOIN cached_items c ON c.local_id = m.local_id JOIN favourites f ON f.local_id = c.local_id
     WHERE f.account_id = ? AND (m.status IN ('waiting', 'failed') OR m.source_url IS NOT c.image_remote_url OR m.license_url IS NOT c.image_license_url) AND c.image_remote_url IS NOT NULL
     ORDER BY f.added_at DESC`,
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
       WHERE local_id = ? AND EXISTS (SELECT 1 FROM favourites WHERE local_id = ?)
       AND EXISTS (SELECT 1 FROM cached_items WHERE local_id = ? AND image_remote_url = ? AND image_license_url IS ?)`,
      [image ? 'ready' : 'failed', image?.fileName ?? null, image?.bytes ?? null,
       image ? 'ready' : 'failed', sourceUrl, image ? 'ready' : 'failed', licenseUrl, localId, localId, localId, sourceUrl, licenseUrl],
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
