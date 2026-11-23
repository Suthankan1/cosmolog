import { getDiscoveryItemById } from '../src/database/repositories/discoveryRepository';
import { getReadingPackItems, keepReadingPackItem } from '../src/database/repositories/readingPacksRepository';
import { downloadReadingPack, readingPacks } from '../src/features/discovery/readingPacks';
import { fetchNasaApodItem } from '../src/services/api/nasaApodService';
import type { DiscoveryItem } from '../src/database/models';

jest.mock('../src/database/repositories/discoveryRepository');
jest.mock('../src/database/repositories/readingPacksRepository');
jest.mock('../src/services/api/nasaApodService');

const [pack] = readingPacks;
const [first, second, third] = pack.entries;
const plate = (date: string): DiscoveryItem => ({
  localId: 'nasa-apod:' + date, source: 'nasa-apod', externalId: date,
  title: 'NASA plate', summary: 'Summary', body: 'Explanation', publishedAt: date,
  imageRemoteUrl: null, imageLocalUri: null, canonicalUrl: 'https://science.nasa.gov/apod/',
  attribution: 'NASA', author: null, mediaType: 'image', fetchedAt: date, updatedAt: date,
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getReadingPackItems).mockResolvedValue([]);
  jest.mocked(getDiscoveryItemById).mockResolvedValue(null);
});

it('retries only missing plates and prefers the cache before using the NASA adapter', async () => {
  jest.mocked(getReadingPackItems).mockResolvedValue([{
    ...plate(first.date), packId: pack.id, mediaStatus: 'text-only', imageBytes: 0,
  }]);
  jest.mocked(getDiscoveryItemById).mockResolvedValueOnce(plate(second.date));
  jest.mocked(fetchNasaApodItem).mockRejectedValueOnce(new Error('Connection lost'));
  const onSaved = jest.fn().mockResolvedValue(undefined);
  const { signal } = new AbortController();
  await expect(downloadReadingPack(7, pack, signal, onSaved)).resolves.toEqual([third.date]);
  expect(fetchNasaApodItem).toHaveBeenCalledTimes(1);
  expect(fetchNasaApodItem).toHaveBeenCalledWith(third.date, signal);
  expect(keepReadingPackItem).toHaveBeenCalledTimes(1);
  expect(keepReadingPackItem).toHaveBeenCalledWith(7, pack.id, plate(second.date));
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it('does not attach an in-flight result or start more requests after cancellation', async () => {
  const controller = new AbortController();
  jest.mocked(fetchNasaApodItem).mockImplementationOnce(async () => {
    controller.abort();
    return plate(first.date);
  });
  await downloadReadingPack(7, pack, controller.signal, async () => {});
  expect(fetchNasaApodItem).toHaveBeenCalledTimes(1);
  expect(keepReadingPackItem).not.toHaveBeenCalled();
});
