import { Paths } from 'expo-file-system';
import { getDiscoveryItemById } from '../../database/repositories/discoveryRepository';
import { getReadingPackItems, keepReadingPackItem, removeReadingPack } from '../../database/repositories/readingPacksRepository';
import { fetchNasaApodItem } from '../../services/api/nasaApodService';
import {
  getExpeditionCompletedStepIds,
  markExpeditionStepCompleted,
  resetExpeditionProgress,
} from '../../database/repositories/expeditionsRepository';
import type { ExpeditionManifest } from './manifest';

export interface ExpeditionDownloadResult {
  missingSteps: string[];
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
  const completedStepIds = await getExpeditionCompletedStepIds(accountId, expedition.id);
  const missingSteps: string[] = [];

  for (const step of expedition.steps) {
    if (signal.aborted) break;

    if (step.kind === 'discovery' && step.date) {
      if (installedDates.has(step.date)) {
        if (!completedStepIds.has(step.id)) {
          await markExpeditionStepCompleted(accountId, expedition.id, step.id);
        }
        continue;
      }

      let saved = false;
      try {
        const item = (await getDiscoveryItemById('nasa-apod:' + step.date)) ??
          (signal.aborted ? null : await fetchNasaApodItem(step.date, signal));

        if (signal.aborted) break;

        if (item) {
          await keepReadingPackItem(accountId, expedition.id, item);
          await markExpeditionStepCompleted(accountId, expedition.id, step.id);
          saved = true;
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
    aborted: signal.aborted,
  };
}

export async function removeExpeditionDownload(accountId: number, expeditionId: string): Promise<void> {
  if (accountId <= 0) return;
  await removeReadingPack(accountId, expeditionId);
  await resetExpeditionProgress(accountId, expeditionId);
}
