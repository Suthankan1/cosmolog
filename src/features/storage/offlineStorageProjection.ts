import { getDatabase } from '../../database/db';
import { getDeviceTotalMediaBytes, getLocalImage, pruneImageFiles } from '../../services/storage/imageStorage';
import {
  mapSavedMedia,
  reconcileSavedImages,
  type MediaStatus,
  type SavedMediaRow,
} from '../../database/repositories/mediaRepository';
import { installedPacks } from '../study/packRepository';
import { getAllExpeditions } from '../expeditions/manifest';
import { withExclusiveMediaLock } from '../../services/storage/mediaCoordinator';

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
  // Accurate, deduplicated storage telemetry
  deviceTotalMediaBytes: number;     // Total physical media on disk across all device files
  accountMediaBytes: number;         // Physical on-disk media files owned by current account (deduplicated)
  sharedMediaBytes: number;          // Physical media owned by current account and shared with others
  physicalMediaBytes: number;        // Alias for accountMediaBytes (backward compatibility)
  installedStudyContentBytes: number;// Installed Space Study curriculum content size in database records
  installedStudyTextBytes: number;   // Alias for installedStudyContentBytes
  reclaimableMediaBytes: number;     // Physical media bytes of unowned cache genuinely eligible to prune
  totalRetainedBytes: number;        // accountMediaBytes + installedStudyContentBytes
  totalUniqueFilesCount: number;     // Count of distinct physical media files owned by current account

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
  const seenAccountFiles = new Set<string>();
  const seenSharedFiles = new Set<string>();
  let accountMediaBytes = 0;
  let sharedMediaBytes = 0;

  const measureAccountFile = (fileName: string | null, isShared: boolean): number => {
    if (!fileName) return 0;
    const file = getLocalImage(fileName);
    if (!file) return 0;
    if (!seenAccountFiles.has(fileName)) {
      seenAccountFiles.add(fileName);
      accountMediaBytes += file.bytes;
    }
    if (isShared && !seenSharedFiles.has(fileName)) {
      seenSharedFiles.add(fileName);
      sharedMediaBytes += file.bytes;
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
    const media = mapSavedMedia(row);
    const isShared = row.other_owners_count > 0;
    const bytes = measureAccountFile(row.file_name, isShared);
    favouritesBytes += bytes;

    return {
      id: row.local_id,
      title: row.title,
      category: 'favourite',
      bytes,
      fileName: row.file_name,
      status: media.mediaStatus,
      isShared,
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
    const media = mapSavedMedia(row);
    const isShared = row.other_owners_count > 0;
    const bytes = measureAccountFile(row.file_name, isShared);
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
      isShared,
      ownershipReason: `Expedition pack: ${packName}`,
    };
  });

  // 3. Space Study supplements (installed on device, shared across accounts)
  // Payload size represents content size in SQLite records, distinct from physical media
  const studyRows = await installedPacks();
  let installedStudyContentBytes = 0;
  const study: StorageItemDetail[] = studyRows.map(p => {
    installedStudyContentBytes += p.bytes;
    return {
      id: p.id,
      title: `Study Pack: ${p.id} (rev ${p.revision})`,
      category: 'study_pack',
      bytes: p.bytes,
      fileName: null,
      status: 'ready',
      isShared: true,
      ownershipReason: 'Installed Space Study supplement content',
    };
  });

  // 4. Feed cache (items not favourited or in packs by ANY account)
  // Ensure files referenced by ANY retained owner are excluded from reclaimable storage
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

  // Find genuinely unowned files (files not referenced by any retained owner)
  const unownedFilesQuery = await db.getAllAsync<{ file_name: string }>(
    `SELECT DISTINCT m.file_name FROM saved_media m
     WHERE m.file_name IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM offline_item_owners o
         JOIN saved_media sm ON sm.local_id = o.local_id
         WHERE sm.file_name = m.file_name
       )`,
  );
  const genuinelyUnownedFileNames = new Set(unownedFilesQuery.map(r => r.file_name));

  let reclaimableMediaBytes = 0;
  const seenReclaimableFiles = new Set<string>();

  const cache: StorageItemDetail[] = cacheRows.map(row => {
    const media = mapSavedMedia(row);
    let bytes = 0;
    if (row.file_name) {
      const file = getLocalImage(row.file_name);
      if (file) {
        // Only attribute bytes and mark reclaimable if file is NOT referenced by any retained owner
        if (genuinelyUnownedFileNames.has(row.file_name)) {
          bytes = file.bytes;
          if (!seenReclaimableFiles.has(row.file_name)) {
            seenReclaimableFiles.add(row.file_name);
            reclaimableMediaBytes += file.bytes;
          }
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
      ownershipReason: genuinelyUnownedFileNames.has(row.file_name ?? '')
        ? 'Recent discovery cache (eligible to clear)'
        : 'Recent discovery cache (file retained by active records)',
    };
  });

  const deviceTotal = getDeviceTotalMediaBytes();

  return {
    deviceTotalMediaBytes: deviceTotal.totalBytes,
    accountMediaBytes,
    sharedMediaBytes,
    physicalMediaBytes: accountMediaBytes,
    installedStudyContentBytes,
    installedStudyTextBytes: installedStudyContentBytes,
    reclaimableMediaBytes,
    totalRetainedBytes: accountMediaBytes + installedStudyContentBytes,
    totalUniqueFilesCount: seenAccountFiles.size,
    favouritesBytes,
    favouritesCount: favourites.length,
    expeditionsBytes,
    expeditionsCount: expeditions.length,
    studyBytes: installedStudyContentBytes,
    studyCount: study.length,
    cacheBytes: reclaimableMediaBytes,
    cacheCount: cache.length,
    reclaimableBytes: reclaimableMediaBytes,
    reclaimableCount: seenReclaimableFiles.size,
    totalPhysicalBytes: accountMediaBytes,
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
  const favCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM favourites WHERE account_id = ?',
    [accountId],
  );
  const packCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM reading_pack_items WHERE account_id = ?',
    [accountId],
  );

  // Files referenced by ANY retained owner across ANY account are strictly excluded
  const unownedRows = await db.getAllAsync<{ file_name: string }>(
    `SELECT DISTINCT m.file_name FROM saved_media m
     WHERE m.file_name IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM offline_item_owners o
         JOIN saved_media sm ON sm.local_id = o.local_id
         WHERE sm.file_name = m.file_name
       )`,
  );

  let reclaimableBytes = 0;
  let reclaimableCount = 0;
  for (const row of unownedRows) {
    const file = getLocalImage(row.file_name);
    if (file) {
      reclaimableBytes += file.bytes;
      reclaimableCount++;
    }
  }

  return {
    reclaimableCount,
    reclaimableBytes,
    protectedFavouritesCount: favCountRow?.count ?? 0,
    protectedPackItemsCount: packCountRow?.count ?? 0,
  };
}

export async function clearEligibleCache(): Promise<{ clearedCount: number; freedBytes: number }> {
  // Coordinated exclusive media lock prevents concurrent downloads or pruning
  return withExclusiveMediaLock(async () => {
    // 1. Reconcile database records (deletes saved_media for unowned items, returns retained filenames)
    const retainedFiles = await reconcileSavedImages();
    // 2. Prune unowned physical files from filesystem and record actual deletion results
    const pruneResult = pruneImageFiles(retainedFiles);

    return {
      clearedCount: pruneResult.deletedCount,
      freedBytes: pruneResult.deletedBytes,
    };
  });
}
