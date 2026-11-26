import { getDatabase } from '../../database/db';
import { getLocalImage, pruneImageFiles } from '../../services/storage/imageStorage';
import {
  mapSavedMedia,
  reconcileSavedImages,
  type MediaStatus,
  type SavedMediaRow,
} from '../../database/repositories/mediaRepository';
import { installedPacks } from '../study/packRepository';
import { getAllExpeditions } from '../expeditions/manifest';
import { waitForMediaWorker } from '../../store/slices/favouritesSlice';

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
  // Finding 5: Honest, deduplicated and distinct telemetry labels
  physicalMediaBytes: number;        // Physical on-disk media files in app storage (deduplicated)
  installedStudyTextBytes: number;   // Installed Space Study curriculum text records in database
  reclaimableMediaBytes: number;     // Physical media bytes of unowned cache eligible to prune
  totalRetainedBytes: number;        // physicalMediaBytes + installedStudyTextBytes
  totalUniqueFilesCount: number;     // Count of distinct physical media files on disk

  // Breakdown metrics
  favouritesBytes: number;
  favouritesCount: number;
  expeditionsBytes: number;
  expeditionsCount: number;
  studyBytes: number;
  studyCount: number;
  cacheBytes: number;
  cacheCount: number;
  reclaimableBytes: number;          // alias for reclaimableMediaBytes
  reclaimableCount: number;
  totalPhysicalBytes: number;        // backward-compatibility alias for physicalMediaBytes

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
  let physicalMediaBytes = 0;

  const measureFile = (fileName: string | null): number => {
    if (!fileName) return 0;
    const file = getLocalImage(fileName);
    if (!file) return 0;
    if (!seenFiles.has(fileName)) {
      seenFiles.add(fileName);
      physicalMediaBytes += file.bytes;
    }
    return file.bytes;
  };

  // 1. Favourites for current account
  const favRows = await db.getAllAsync<SavedMediaRow & {
    local_id: string;
    title: string;
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
    // Finding 3: Reuse canonical media validation and licensing logic
    const media = mapSavedMedia(row);
    const bytes = measureFile(row.file_name);
    favouritesBytes += bytes;

    return {
      id: row.local_id,
      title: row.title,
      category: 'favourite',
      bytes,
      fileName: row.file_name,
      status: media.mediaStatus,
      isShared: row.other_owners_count > 0,
      ownershipReason: 'Field Shelf favourite',
    };
  });

  // 2. Expedition / Reading Pack items for current account
  const packRows = await db.getAllAsync<SavedMediaRow & {
    pack_id: string;
    local_id: string;
    title: string;
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
    // Finding 3: Reuse canonical media validation and licensing logic
    const media = mapSavedMedia(row);
    const bytes = measureFile(row.file_name);
    expeditionsBytes += bytes;

    const exp = expeditionsList.find(e => e.id === row.pack_id);
    const packName = exp?.title ?? row.pack_id;

    return {
      id: `${row.pack_id}:${row.local_id}`,
      title: `${row.title} (${packName})`,
      category: 'expedition',
      bytes,
      fileName: row.file_name,
      status: media.mediaStatus,
      isShared: row.other_owners_count > 0,
      ownershipReason: `Expedition pack: ${packName}`,
    };
  });

  // 3. Space Study supplements (installed on device, shared across accounts)
  // Finding 5: Kept distinct from physical disk media bytes
  const studyRows = await installedPacks();
  let installedStudyTextBytes = 0;
  const study: StorageItemDetail[] = studyRows.map(p => {
    installedStudyTextBytes += p.bytes;
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

  // 4. Feed cache (items not favourited or in packs by ANY account)
  const cacheRows = await db.getAllAsync<SavedMediaRow & {
    local_id: string;
    title: string;
  }>(
    `SELECT c.local_id, c.title, c.source, c.attribution, c.image_remote_url, c.image_license_url,
            m.file_name, m.status, m.source_url, m.license_url
     FROM cached_items c
     LEFT JOIN saved_media m ON m.local_id = c.local_id
     WHERE NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = c.local_id)
     ORDER BY c.fetched_at DESC`,
  );

  let reclaimableMediaBytes = 0;
  const seenReclaimableFiles = new Set<string>();

  const cache: StorageItemDetail[] = cacheRows.map(row => {
    const media = mapSavedMedia(row);
    let bytes = 0;
    if (row.file_name) {
      const file = getLocalImage(row.file_name);
      if (file) {
        bytes = file.bytes;
        if (!seenReclaimableFiles.has(row.file_name)) {
          seenReclaimableFiles.add(row.file_name);
          reclaimableMediaBytes += file.bytes;
        }
      }
    }
    return {
      id: row.local_id,
      title: row.title,
      category: 'feed_cache',
      bytes,
      fileName: row.file_name,
      status: media.mediaStatus,
      isShared: false,
      ownershipReason: 'Recent discovery cache (eligible to clear)',
    };
  });

  return {
    physicalMediaBytes,
    installedStudyTextBytes,
    reclaimableMediaBytes,
    totalRetainedBytes: physicalMediaBytes + installedStudyTextBytes,
    totalUniqueFilesCount: seenFiles.size,
    favouritesBytes,
    favouritesCount: favourites.length,
    expeditionsBytes,
    expeditionsCount: expeditions.length,
    studyBytes: installedStudyTextBytes,
    studyCount: study.length,
    cacheBytes: reclaimableMediaBytes,
    cacheCount: cache.length,
    reclaimableBytes: reclaimableMediaBytes,
    reclaimableCount: cache.length,
    totalPhysicalBytes: physicalMediaBytes,
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
  const seenFiles = new Set<string>();
  for (const row of cacheRows) {
    if (row.file_name && !seenFiles.has(row.file_name)) {
      seenFiles.add(row.file_name);
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
  // Finding 4: Coordinate with media download worker to prevent concurrent deletion
  await waitForMediaWorker();

  const db = await getDatabase();
  const unownedMedia = await db.getAllAsync<{ file_name: string | null }>(
    `SELECT file_name FROM saved_media WHERE NOT EXISTS (SELECT 1 FROM offline_item_owners WHERE local_id = saved_media.local_id)`,
  );
  let freedBytes = 0;
  const seenFreed = new Set<string>();
  for (const m of unownedMedia) {
    if (m.file_name && !seenFreed.has(m.file_name)) {
      seenFreed.add(m.file_name);
      const file = getLocalImage(m.file_name);
      if (file) freedBytes += file.bytes;
    }
  }

  // Reconcile saved images database rows
  const retainedFiles = await reconcileSavedImages();
  // Prune unowned physical files from filesystem
  pruneImageFiles(retainedFiles);

  return {
    clearedCount: unownedMedia.length,
    freedBytes,
  };
}
