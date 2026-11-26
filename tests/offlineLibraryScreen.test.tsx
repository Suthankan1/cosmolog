import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import OfflineLibraryScreen from '../app/offline-library';
import {
  clearEligibleCache,
  getOfflineStorageSummary,
  previewClearCache,
} from '../src/features/storage/offlineStorageProjection';
import { useAppDispatch, useAppSelector } from '../src/store';

jest.mock('../src/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../src/features/storage/offlineStorageProjection');
jest.mock('../src/store/slices/favouritesSlice', () => ({
  refreshImagesThunk: jest.fn(),
}));

const mockDispatch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAppDispatch).mockReturnValue(mockDispatch);
  jest.mocked(useAppSelector).mockImplementation(selector =>
    selector({
      auth: { user: { id: 7, username: 'emilys' } },
      favourites: { isDownloading: false },
      feed: {
        connection: 'online',
        metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T14:00:00Z' } },
        legacySyncedAt: null,
      },
    } as never),
  );

  jest.mocked(getOfflineStorageSummary).mockResolvedValue({
    totalPhysicalBytes: 3_500_000,
    physicalMediaBytes: 3_000_000,
    installedStudyTextBytes: 500_000,
    reclaimableMediaBytes: 200_000,
    totalRetainedBytes: 3_500_000,
    totalUniqueFilesCount: 4,
    favouritesBytes: 2_000_000,
    favouritesCount: 2,
    expeditionsBytes: 1_000_000,
    expeditionsCount: 1,
    studyBytes: 500_000,
    studyCount: 1,
    cacheBytes: 200_000,
    cacheCount: 3,
    reclaimableBytes: 200_000,
    reclaimableCount: 3,
    items: {
      favourites: [
        {
          id: 'fav-1',
          title: 'Saturn Rings',
          category: 'favourite',
          bytes: 2_000_000,
          fileName: 'saturn.jpg',
          status: 'ready',
          isShared: false,
          ownershipReason: 'Field Shelf favourite',
        },
      ],
      expeditions: [
        {
          id: 'saturn:step-1',
          title: 'In the Shadow of Saturn',
          category: 'expedition',
          bytes: 1_000_000,
          fileName: 'shadow.jpg',
          status: 'ready',
          isShared: true,
          ownershipReason: 'Expedition pack: A Tour of Saturn',
        },
      ],
      study: [
        {
          id: 'observatories',
          title: 'Observatories Supplement',
          category: 'study_pack',
          bytes: 500_000,
          fileName: null,
          status: 'ready',
          isShared: true,
          ownershipReason: 'Installed Space Study supplement (shared on device)',
        },
      ],
      cache: [
        {
          id: 'cache-1',
          title: 'Old Space News',
          category: 'feed_cache',
          bytes: 200_000,
          fileName: 'news.jpg',
          status: 'ready',
          isShared: false,
          ownershipReason: 'Recent discovery cache (eligible to clear)',
        },
      ],
    },
  });

  jest.mocked(previewClearCache).mockResolvedValue({
    reclaimableCount: 3,
    reclaimableBytes: 200_000,
    protectedFavouritesCount: 2,
    protectedPackItemsCount: 1,
  });

  jest.mocked(clearEligibleCache).mockResolvedValue({
    clearedCount: 3,
    freedBytes: 200_000,
  });
});

describe('Offline Library Screen (F02)', () => {
  it('renders total physical storage telemetry and breakdown cards', async () => {
    await act(async () => {
      render(<OfflineLibraryScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('PHYSICAL MEDIA ON DISK')).toBeTruthy();
      expect(screen.getByText('2.9 MB')).toBeTruthy();
    });

    expect(screen.getByText('Unique files')).toBeTruthy();
    expect(screen.getByText('Study text')).toBeTruthy();
    expect(screen.getByText('Eligible to clear')).toBeTruthy();
    expect(screen.getByText('Field Shelf favourites')).toBeTruthy();
    expect(screen.getByText('Expedition packs')).toBeTruthy();
    expect(screen.getByText('Space Study supplements')).toBeTruthy();
    expect(screen.getByText('Discovery feed cache')).toBeTruthy();
  });

  it('disables clean cache button while media is actively downloading (Finding 4)', async () => {
    jest.mocked(useAppSelector).mockImplementation(selector =>
      selector({
        auth: { user: { id: 7, username: 'emilys' } },
        favourites: { isDownloading: true },
        feed: {
          connection: 'online',
          metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T14:00:00Z' } },
          legacySyncedAt: null,
        },
      } as never),
    );

    await act(async () => {
      render(<OfflineLibraryScreen />);
    });

    await waitFor(() => {
      const cleanBtn = screen.getByLabelText('Clean unowned discovery cache');
      expect(cleanBtn.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('displays favourite items, status pills, and shared badges', async () => {
    await act(async () => {
      render(<OfflineLibraryScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('Saturn Rings')).toBeTruthy();
      expect(screen.getByText('OFFLINE READY')).toBeTruthy();
    });
  });

  it('triggers confirmation alert before cleaning unowned cache', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    await act(async () => {
      render(<OfflineLibraryScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('Clean unowned cache')).toBeTruthy();
    });

    const cleanBtn = screen.getByLabelText('Clean unowned discovery cache');
    await act(async () => {
      fireEvent.press(cleanBtn);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Clean unowned cache?',
      expect.stringContaining('2 Field Shelf favourites, notes, and 1 expedition downloads are protected'),
      expect.any(Array),
    );
  });

  it('renders offline banner when connection is offline', async () => {
    jest.mocked(useAppSelector).mockImplementation(selector =>
      selector({
        auth: { user: { id: 7, username: 'emilys' } },
        favourites: { isDownloading: false },
        feed: {
          connection: 'offline',
          metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T14:00:00Z' } },
          legacySyncedAt: null,
        },
      } as never),
    );

    await act(async () => {
      render(<OfflineLibraryScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('You’re offline')).toBeTruthy();
    });
  });
});
