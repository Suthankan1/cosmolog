import { getDatabase } from '../../database/db';
import { getLocalImage, pruneImageFiles } from '../../services/storage/imageStorage';
import { mayDownloadImage } from '../../services/api/mediaPolicy';
import { reconcileSavedImages, type MediaStatus } from '../../database/repositories/mediaRepository';
import { installedPacks } from '../study/packRepository';
import { getAllExpeditions } from '../expeditions/manifest';

export interface StorageItemDetail {
  id: string;
  title: string;
  category: 'favourite' | 'expedition' | 'study_pack' | 'feed_cache';
  bytes: number;
  fileName: string | null;
  status: MediaStatus;
  isShared: boolean;
  ownershipReason: string;
}

export interface OfflineStorageSummary {
  totalPhysicalBytes: number;
  totalUniqueFilesCount: number;
  favouritesBytes: number;
  favouritesCount: number;
  expeditionsBytes: number;
  expeditionsCount: number;
  studyBytes: number;
  studyCount: number;
  cacheBytes: number;
  cacheCount: number;
  reclaimableBytes: number;
  reclaimableCount: number;
  items: {
    favourites: StorageItemDetail[];
    expeditions: StorageItemDetail[];
    study: StorageItemDetail[];
    cache: StorageItemDetail[];
  };
}

export interface ClearCachePreview {
  reclaimableCount: number;
  reclaimableBytes: number;
  protectedFavouritesCount: number;
  protectedPackItemsCount: number;
}

export async function getOfflineStorageSummary(accountId: number): Promise<OfflineStorageSummary> {
  const db = await getDatabase();
  const seenFiles = new Set<string>();
  let totalPhysicalBytes = 0;

  const measureFile = (fileName: string | null): number => {
    if (!fileName) return 0;
    const file = getLocalImage(fileName);
    if (!file) return 0;
    if (!seenFiles.has(fileName)) {
      seenFiles.add(fileName);
      totalPhysicalBytes += file.bytes;
    }
    return file.bytes;
  };

  // 1. Favourites for current account
  const favRows = await db.getAllAsync<{
    local_id: string;
    title: string;
    source: string;
    attribution: string | null;
    image_remote_url: string | null;
    image_license_url: string | null;
    file_name: string | null;
    status: string | null;
    source_url: string | null;
    license_url: string | null;
    other_owners_count: number;
  }>(
    `SELECT c.local_id, c.title, c.source, c.attribution, c.image_remote_url, c.image_license_url,
            m.file_name, m.status, m.source_url, m.license_url,
            (SELECT COUNT(*) FROM offline_item_owners WHERE local_id = c.local_id AND account_id != ?) AS other_owners_count
     FROM favourites f
     JOIN cached_items c ON c.local_id = f.local_id
     LEFT JOIN saved_media m ON m.local_id = c.local_id
     WHERE f.account_id = ?
     ORDER BY f.added_at DESC`,
    [accountId, accountId],
  );

  let favouritesBytes = 0;
  const favourites: StorageItemDetail[] = favRows.map(row => {
    const bytes = measureFile(row.file_name);
    favouritesBytes += bytes;
    const eligible = mayDownloadImage(row.source, row.image_remote_url, row.attribution, row.image_license_url);
    const hasImage = Boolean(row.file_name && getLocalImage(row.file_name));
    const status: MediaStatus = eligible
      ? hasImage
        ? row.source_url === row.image_remote_url ? 'ready' : 'previous'
        : row.status === 'failed' ? 'failed' : 'waiting'
      : 'text-only';

    return {
      id: row.local_id,
      title: row.title,
      category: 'favourite',
      bytes,
      fileName: row.file_name,
      status,
      isShared: row.other_owners_count > 0,
      ownershipReason: 'Field Shelf favourite',
    };
  });

  // 2. Expedition / Reading Pack items for current account
  const packRows = await db.getAllAsync<{
    pack_id: string;
    local_id: string;
    title: string;
    source: string;
    attribution: string | null;
    image_remote_url: string | null;
    image_license_url: string | null;
    file_name: string | null;
    status: string | null;
    source_url: string | null;
    license_url: string | null;
    other_owners_count: number;
  }>(
    `SELECT p.pack_id, c.local_id, c.title, c.source, c.attribution, c.image_remote_url, c.image_license_url,
            m.file_name, m.status, m.source_url, m.license_url,
            (SELECT COUNT(*) FROM offline_item_owners WHERE local_id = c.local_id AND account_id != ?) AS other_owners_count
     FROM reading_pack_items p
     JOIN cached_items c ON c.local_id = p.local_id
     LEFT JOIN saved_media m ON m.local_id = c.local_id
     WHERE p.account_id = ?
     ORDER BY p.pack_id, p.added_at DESC`,
    [accountId, accountId],
  );

  const expeditionsList = getAllExpeditions();
  let expeditionsBytes = 0;
  const expeditions: StorageItemDetail[] = packRows.map(row => {
    const bytes = measureFile(row.file_name);
    expeditionsBytes += bytes;
    const eligible = mayDownloadImage(row.source, row.image_remote_url, row.attribution, row.image_license_url);
    const hasImage = Boolean(row.file_name && getLocalImage(row.file_name));
    const status: MediaStatus = eligible
      ? hasImage
        ? row.source_url === row.image_remote_url ? 'ready' : 'previous'
        : row.status === 'failed' ? 'failed' : 'waiting'
      : 'text-only';

    const exp = expeditionsList.find(e => e.id === row.pack_id);
    const packName = exp?.title ?? row.pack_id;

    return {
      id: `${row.pack_id}:${row.local_id}`,
      title: `${row.title} (${packName})`,
      category: 'expedition',
      bytes,
      fileName: row.file_name,
      status,
      isShared: row.other_owners_count > 0,
      ownershipReason: `Expedition pack: ${packName}`,
    };
  });

  // 3. Space Study supplements (installed on device, shared across accounts)
  const studyRows = await installedPacks();
  let studyBytes = 0;
  const study: StorageItemDetail[] = studyRows.map(p => {
    studyBytes += p.bytes;
    return {
      id: p.id,
      title: `Study Pack: ${p.id} (rev ${p.revision})`,
      category: 'study_pack',
      bytes: p.bytes,
      fileName: null,
      status: 'ready',
      isShared: true,
      ownershipReason: 'Installed Space Study supplement (shared on device)',
    };
  });
  totalPhysicalBytes += studyBytes;

  // 4. Feed cache (items not favourited or in packs by ANY account)
  const cacheRows = await db.getAllAsync<{
    local_id: string;
    title: string;
    file_name: string | null;
    status: string | null;
  }>(
    `SELECT c.local_id, c.title, m.file_name, m.status
     FROM cached_items c
     LEFT JOIN saved_media m ON m.local_id = c.local_id
     WHERE NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id)
     ORDER BY c.fetched_at DESC`,
  );

  let cacheBytes = 0;
  const cache: StorageItemDetail[] = cacheRows.map(row => {
    const bytes = measureFile(row.file_name);
    cacheBytes += bytes;
    return {
      id: row.local_id,
      title: row.title,
      category: 'feed_cache',
      bytes,
      fileName: row.file_name,
      status: row.file_name && getLocalImage(row.file_name) ? 'ready' : 'text-only',
      isShared: false,
      ownershipReason: 'Recent discovery cache (eligible to clear)',
    };
  });

  return {
    totalPhysicalBytes,
    totalUniqueFilesCount: seenFiles.size,
    favouritesBytes,
    favouritesCount: favourites.length,
    expeditionsBytes,
    expeditionsCount: expeditions.length,
    studyBytes,
    studyCount: study.length,
    cacheBytes,
    cacheCount: cache.length,
    reclaimableBytes: cacheBytes,
    reclaimableCount: cache.length,
    items: {
      favourites,
      expeditions,
      study,
      cache,
    },
  };
}

export async function previewClearCache(accountId: number): Promise<ClearCachePreview> {
  const db = await getDatabase();
  const cacheCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM cached_items c WHERE NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id)',
  );
  const favCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM favourites WHERE account_id = ?',
    [accountId],
  );
  const packCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM reading_pack_items WHERE account_id = ?',
    [accountId],
  );

  const cacheRows = await db.getAllAsync<{ file_name: string | null }>(
    `SELECT m.file_name FROM cached_items c
     LEFT JOIN saved_media m ON m.local_id = c.local_id
     WHERE NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id)`,
  );

  let reclaimableBytes = 0;
  for (const row of cacheRows) {
    if (row.file_name) {
      const file = getLocalImage(row.file_name);
      if (file) reclaimableBytes += file.bytes;
    }
  }

  return {
    reclaimableCount: cacheCountRow?.count ?? 0,
    reclaimableBytes,
    protectedFavouritesCount: favCountRow?.count ?? 0,
    protectedPackItemsCount: packCountRow?.count ?? 0,
  };
}

export async function clearEligibleCache(): Promise<{ clearedCount: number; freedBytes: number }> {
  const db = await getDatabase();
  const unownedMedia = await db.getAllAsync<{ file_name: string | null }>(
    `SELECT file_name FROM saved_media WHERE NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = saved_media.local_id)`,
  );
  let freedBytes = 0;
  for (const m of unownedMedia) {
    if (m.file_name) {
      const file = getLocalImage(m.file_name);
      if (file) freedBytes += file.bytes;
    }
  }

  // Reconcile saved images database rows (calls writeDatabase internally)
  const retainedFiles = await reconcileSavedImages();
  // Prune unowned physical files from filesystem
  pruneImageFiles(retainedFiles);

  return {
    clearedCount: unownedMedia.length,
    freedBytes,
  };
}
