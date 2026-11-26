import { Paths } from 'expo-file-system';
import { getDiscoveryItemById } from '../src/database/repositories/discoveryRepository';
import { getReadingPackItems, keepReadingPackItem, removeReadingPack } from '../src/database/repositories/readingPacksRepository';
import {
  getExpeditionCompletedStepIds,
  markExpeditionStepCompleted,
  resetExpeditionProgress,
} from '../src/database/repositories/expeditionsRepository';
import { downloadExpedition, removeExpeditionDownload } from '../src/features/expeditions/expeditionDownloads';
import { getExpeditionById, type DiscoveryStep } from '../src/features/expeditions/manifest';
import { fetchNasaApodItem } from '../src/services/api/nasaApodService';
import type { DiscoveryItem } from '../src/database/models';

jest.mock('../src/database/repositories/discoveryRepository');
jest.mock('../src/database/repositories/readingPacksRepository');
jest.mock('../src/database/repositories/expeditionsRepository');
jest.mock('../src/services/api/nasaApodService');
jest.mock('expo-file-system', () => ({
  Paths: {
    availableDiskSpace: 50_000_000,
  },
}));

const saturn = getExpeditionById('saturn')!;
const discoverySteps = saturn.steps.filter((s): s is DiscoveryStep => s.kind === 'discovery');
const first = discoverySteps[0];
const second = discoverySteps[1];
const third = discoverySteps[2];

const plate = (date: string): DiscoveryItem => ({
  localId: 'nasa-apod:' + date,
  source: 'nasa-apod',
  externalId: date,
  title: 'Saturn Plate ' + date,
  summary: 'Summary of ' + date,
  body: 'Explanation of ' + date,
  publishedAt: date,
  imageRemoteUrl: null,
  imageLocalUri: null,
  canonicalUrl: 'https://science.nasa.gov/apod/',
  attribution: 'NASA/JPL',
  author: null,
  mediaType: 'image',
  fetchedAt: date,
  updatedAt: date,
});

beforeEach(() => {
  jest.resetAllMocks();
  (Paths as { availableDiskSpace: number }).availableDiskSpace = 50_000_000;
  jest.mocked(getReadingPackItems).mockResolvedValue([]);
  jest.mocked(getExpeditionCompletedStepIds).mockResolvedValue(new Set());
  jest.mocked(getDiscoveryItemById).mockResolvedValue(null);
  jest.mocked(markExpeditionStepCompleted).mockResolvedValue(undefined);
  jest.mocked(keepReadingPackItem).mockResolvedValue(undefined);
  jest.mocked(removeReadingPack).mockResolvedValue(undefined);
  jest.mocked(resetExpeditionProgress).mockResolvedValue(undefined);
});

describe('Expedition Download Orchestrator', () => {
  it('rejects download when free disk space is insufficient', async () => {
    (Paths as { availableDiskSpace: number }).availableDiskSpace = 1000; // Less than required
    const { signal } = new AbortController();

    await expect(downloadExpedition(1, saturn, signal)).rejects.toThrow(
      /Insufficient free storage to download expedition/,
    );
    expect(fetchNasaApodItem).not.toHaveBeenCalled();
  });

  it('resumes and skips already installed steps while downloading missing ones', async () => {
    // First step already installed in reading pack
    jest.mocked(getReadingPackItems).mockResolvedValue([
      {
        ...plate(first.date!),
        packId: saturn.id,
        mediaStatus: 'ready',
        imageBytes: 1024,
      },
    ]);
    // Second step cached locally in discovery
    jest.mocked(getDiscoveryItemById).mockResolvedValueOnce(plate(second.date!));
    // Third step fetched from API
    jest.mocked(fetchNasaApodItem).mockResolvedValueOnce(plate(third.date!));

    const onStepSaved = jest.fn().mockResolvedValue(undefined);
    const { signal } = new AbortController();

    const result = await downloadExpedition(1, saturn, signal, onStepSaved);

    expect(result.missingSteps).toEqual([]);
    expect(result.aborted).toBe(false);

    // Finding 1: Download availability must NOT automatically mark steps as learned/completed
    expect(markExpeditionStepCompleted).not.toHaveBeenCalled();

    // Second was from cache
    expect(keepReadingPackItem).toHaveBeenCalledWith(1, saturn.id, plate(second.date!));

    // Third was fetched
    expect(fetchNasaApodItem).toHaveBeenCalledWith(third.date, signal);
    expect(keepReadingPackItem).toHaveBeenCalledWith(1, saturn.id, plate(third.date!));

    expect(onStepSaved).toHaveBeenCalledTimes(2); // for second and third
  });

  it('stops cleanly and skips remaining steps when signal is aborted', async () => {
    const controller = new AbortController();
    jest.mocked(fetchNasaApodItem).mockImplementationOnce(async () => {
      controller.abort();
      return plate(first.date!);
    });

    const result = await downloadExpedition(1, saturn, controller.signal);

    expect(result.aborted).toBe(true);
    expect(fetchNasaApodItem).toHaveBeenCalledTimes(1);
    expect(keepReadingPackItem).not.toHaveBeenCalled();
  });

  it('tracks failed steps without crashing the entire run', async () => {
    jest.mocked(fetchNasaApodItem)
      .mockResolvedValueOnce(plate(first.date!))
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(plate(third.date!));

    const { signal } = new AbortController();
    const result = await downloadExpedition(1, saturn, signal);

    expect(result.missingSteps).toEqual([second.id]);
    expect(result.aborted).toBe(false);
    expect(keepReadingPackItem).toHaveBeenCalledTimes(2);
  });

  it('removes expedition items without resetting learning progress', async () => {
    await removeExpeditionDownload(1, saturn.id);
    expect(removeReadingPack).toHaveBeenCalledWith(1, saturn.id);
    expect(resetExpeditionProgress).not.toHaveBeenCalled();
  });

  it('redownloading an expedition preserves completed learning steps', async () => {
    jest.mocked(fetchNasaApodItem)
      .mockResolvedValueOnce(plate(first.date!))
      .mockResolvedValueOnce(plate(second.date!))
      .mockResolvedValueOnce(plate(third.date!));

    const { signal } = new AbortController();
    const result = await downloadExpedition(1, saturn, signal);
    expect(result.downloadedCount).toBe(3);
    expect(resetExpeditionProgress).not.toHaveBeenCalled();
  });
});
