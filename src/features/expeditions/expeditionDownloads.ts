import { Paths } from 'expo-file-system';
import { getDiscoveryItemById } from '../../database/repositories/discoveryRepository';
import { getReadingPackItems, keepReadingPackItem, removeReadingPack } from '../../database/repositories/readingPacksRepository';
import { fetchNasaApodItem } from '../../services/api/nasaApodService';
import type { DiscoveryStep, ExpeditionManifest } from './manifest';

export interface ExpeditionDownloadResult {
  missingSteps: string[];
  downloadedCount: number;
  aborted: boolean;
}

export {
  type ExpeditionReadiness,
  computeExpeditionReadiness,
} from './manifest';

export async function downloadExpedition(
  accountId: number,
  expedition: ExpeditionManifest,
  signal: AbortSignal,
  onStepSaved?: (stepId: string) => Promise<void>,
): Promise<ExpeditionDownloadResult> {
  if (accountId <= 0) throw new Error('Valid account ID required');

  const existingPackItems = await getReadingPackItems(accountId);
  const installedDates = new Set(
    existingPackItems.filter(item => item.packId === expedition.id).map(item => item.externalId),
  );

  // Storage preflight check: ensure at least remaining estimated bytes + 1MB safety margin
  const uninstalledDiscoverySteps = expedition.steps.filter(
    (s): s is DiscoveryStep => s.kind === 'discovery' && !installedDates.has(s.date),
  );
  const estimatedBytesPerStep = expedition.steps.length > 0
    ? Math.round(expedition.estimatedBytes / expedition.steps.length)
    : expedition.estimatedBytes;
  const minRequiredBytes = Math.max(
    1024 * 1024,
    uninstalledDiscoverySteps.length * estimatedBytesPerStep + 1024 * 1024,
  );

  if (typeof Paths?.availableDiskSpace === 'number' && Paths.availableDiskSpace < minRequiredBytes) {
    throw new Error('Insufficient free storage to download expedition.');
  }

  const missingSteps: string[] = [];
  let downloadedCount = 0;

  for (const step of expedition.steps) {
    if (signal.aborted) break;

    if (step.kind === 'discovery') {
      if (installedDates.has(step.date)) {
        // Already installed for offline reading; do NOT auto-mark as learned/completed
        continue;
      }

      let saved = false;
      try {
        const item = (await getDiscoveryItemById('nasa-apod:' + step.date)) ??
          (signal.aborted ? null : await fetchNasaApodItem(step.date, signal));

        if (signal.aborted) break;

        if (item) {
          // Only saves to offline reading pack. Actual learning completion is separate!
          await keepReadingPackItem(accountId, expedition.id, item);
          saved = true;
          downloadedCount++;
          installedDates.add(step.date);
        }
      } catch {
        if (signal.aborted) break;
      }

      if (saved) {
        if (onStepSaved && !signal.aborted) {
          await onStepSaved(step.id);
        }
      } else {
        missingSteps.push(step.id);
      }
    }
  }

  return {
    missingSteps,
    downloadedCount,
    aborted: signal.aborted,
  };
}

export async function removeExpeditionDownload(accountId: number, expeditionId: string): Promise<void> {
  if (accountId <= 0) return;
  // Learning progress is intentionally preserved independently of download removal
  await removeReadingPack(accountId, expeditionId);
}
