import { getDiscoveryItemById } from '../../database/repositories/discoveryRepository';
import { getReadingPackItems, keepReadingPackItem } from '../../database/repositories/readingPacksRepository';
import { fetchNasaApodItem } from '../../services/api/nasaApodService';

interface ReadingPack {
  id: string;
  title: string;
  description: string;
  entries: readonly { date: string; title: string }[];
}

export const readingPacks: readonly ReadingPack[] = [
  {
    id: 'saturn',
    title: 'A Tour of Saturn',
    description: 'Follow Cassini through Saturn’s rings, from its view in the planet’s shadow to its final ring portrait.',
    entries: [
      { date: '2013-11-13', title: 'In the Shadow of Saturn' },
      { date: '2017-08-08', title: 'Density Waves in Saturn’s Rings from Cassini' },
      { date: '2017-09-26', title: 'Cassini’s Last Ring Portrait at Saturn' },
    ],
  },
  {
    id: 'apollo',
    title: 'Apollo at the Moon',
    description: 'See Earth from lunar orbit, look out from Apollo 11’s landing site, and follow the crew’s return to orbit.',
    entries: [
      { date: '2015-09-06', title: 'Earthrise' },
      { date: '2024-07-20', title: 'Apollo 11 Landing Panorama' },
      { date: '2009-07-19', title: 'From the Moon to the Earth' },
    ],
  },
];

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
