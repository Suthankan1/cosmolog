import { Paths } from 'expo-file-system';
import { getDiscoveryItemById } from '../../database/repositories/discoveryRepository';
import { getReadingPackItems, keepReadingPackItem, removeReadingPack } from '../../database/repositories/readingPacksRepository';
import { fetchNasaApodItem } from '../../services/api/nasaApodService';
import { resetExpeditionProgress } from '../../database/repositories/expeditionsRepository';
import type { ExpeditionManifest } from './manifest';

export interface ExpeditionDownloadResult {
  missingSteps: string[];
  downloadedCount: number;
  aborted: boolean;
}

export async function downloadExpedition(
  accountId: number,
  expedition: ExpeditionManifest,
  signal: AbortSignal,
  onStepSaved?: (stepId: string) => Promise<void>,
): Promise<ExpeditionDownloadResult> {
  if (accountId <= 0) throw new Error('Valid account ID required');

  // Storage preflight check: ensure at least estimated bytes + 1MB safety margin
  const minRequiredBytes = expedition.estimatedBytes + 1024 * 1024;
  if (typeof Paths?.availableDiskSpace === 'number' && Paths.availableDiskSpace < minRequiredBytes) {
    throw new Error('Insufficient free storage to download expedition.');
  }

  const existingPackItems = await getReadingPackItems(accountId);
  const installedDates = new Set(
    existingPackItems.filter(item => item.packId === expedition.id).map(item => item.externalId),
  );
  const missingSteps: string[] = [];
  let downloadedCount = 0;

  for (const step of expedition.steps) {
    if (signal.aborted) break;

    if (step.kind === 'discovery' && step.date) {
      if (installedDates.has(step.date)) {
        // Finding 1: Already installed for offline reading; do NOT auto-mark as learned/completed
        continue;
      }

      let saved = false;
      try {
        const item = (await getDiscoveryItemById('nasa-apod:' + step.date)) ??
          (signal.aborted ? null : await fetchNasaApodItem(step.date, signal));

        if (signal.aborted) break;

        if (item) {
          // Finding 1: Only saves to offline reading pack. Actual learning completion is separate!
          await keepReadingPackItem(accountId, expedition.id, item);
          saved = true;
          downloadedCount++;
          installedDates.add(step.date);
        }
      } catch {
        if (signal.aborted) break;
      }

      if (saved) {
        if (onStepSaved) await onStepSaved(step.id);
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
  await removeReadingPack(accountId, expeditionId);
  await resetExpeditionProgress(accountId, expeditionId);
}
