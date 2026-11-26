import { getDiscoveryItemById } from '../../database/repositories/discoveryRepository';
import { getReadingPackItems, keepReadingPackItem } from '../../database/repositories/readingPacksRepository';
import { fetchNasaApodItem } from '../../services/api/nasaApodService';
import { expeditions, getExpeditionDiscoveryDates } from '../expeditions/manifest';

export interface ReadingPack {
  id: string;
  title: string;
  description: string;
  entries: readonly { date: string; title: string }[];
}

export const readingPacks: readonly ReadingPack[] = expeditions.map(exp => ({
  id: exp.id,
  title: exp.title,
  description: exp.description,
  entries: getExpeditionDiscoveryDates(exp),
}));

export async function downloadReadingPack(accountId: number, pack: ReadingPack, signal: AbortSignal, onSaved: () => Promise<void>) {
  const installed = new Set((await getReadingPackItems(accountId))
    .filter(item => item.packId === pack.id)
    .map(item => item.externalId));
  const missing: string[] = [];
  for (const { date } of pack.entries) {
    if (signal.aborted) break;
    if (installed.has(date)) continue;
    let saved = false;
    try {
      const item = await getDiscoveryItemById('nasa-apod:' + date)
        ?? (signal.aborted ? null : await fetchNasaApodItem(date, signal));
      if (signal.aborted) break;
      if (item) {
        await keepReadingPackItem(accountId, pack.id, item);
        saved = true;
      }
    } catch {
      if (signal.aborted) break;
    }
    if (saved) await onSaved();
    else missing.push(date);
  }
  return missing;
}
