import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Linking } from 'react-native';
import ReadingPacksScreen from '../app/reading-packs';
import { getReadingPackItems } from '../src/database/repositories/readingPacksRepository';
import {
  getAllCompletedStepIds,
  markExpeditionStepCompleted,
} from '../src/database/repositories/expeditionsRepository';
import { useAppDispatch, useAppSelector } from '../src/store';
import { downloadExpedition } from '../src/features/expeditions/expeditionDownloads';

jest.mock('../src/features/expeditions/expeditionDownloads');

jest.mock('../src/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../src/database/repositories/readingPacksRepository');
jest.mock('../src/database/repositories/expeditionsRepository');
jest.mock('../src/features/journal/useToggleFavourite', () => ({
  useToggleFavourite: () => jest.fn(),
}));
jest.mock('../src/store/slices/favouritesSlice', () => ({
  refreshImagesThunk: jest.fn(),
}));

const mockDispatch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAppDispatch).mockReturnValue(mockDispatch);
  jest.mocked(useAppSelector).mockImplementation(selector =>
    selector({
      auth: { user: { id: 10, username: 'emilys' } },
      favourites: { favourites: [], pending: {}, mediaRevision: 1, isDownloading: false },
      feed: {
        connection: 'online',
        metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T12:00:00Z' } },
        legacySyncedAt: null,
      },
    } as never),
  );
  jest.mocked(getReadingPackItems).mockResolvedValue([]);
  jest.mocked(getAllCompletedStepIds).mockResolvedValue(new Map());
  jest.mocked(markExpeditionStepCompleted).mockResolvedValue(undefined);
});

describe('Expedition Packs Screen (ReadingPacksScreen)', () => {
  it('renders expedition titles, descriptions, and source credits', async () => {
    await act(async () => {
      render(<ReadingPacksScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('A Tour of Saturn')).toBeTruthy();
      expect(screen.getByText('Apollo at the Moon')).toBeTruthy();
    });

    expect(screen.getAllByText(/Sources/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/NASA Astronomy Picture of the Day Archive/)).toBeTruthy();
    expect(screen.getByText(/Cassini-Huygens Mission at Saturn/)).toBeTruthy();
  });

  it('renders ordered steps across discovery plates, study guide, and field prompts', async () => {
    await act(async () => {
      render(<ReadingPacksScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('In the Shadow of Saturn')).toBeTruthy();
      expect(screen.getByText('Density Waves in Saturn’s Rings')).toBeTruthy();
      expect(screen.getByText('Study: Saturn and Its Rings')).toBeTruthy();
      expect(screen.getByText('Field Observation: Saturn & Ring Tilt')).toBeTruthy();
    });

    expect(screen.getAllByText('CELESTIAL PLATE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SPACE STUDY').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FIELD OBSERVATION').length).toBeGreaterThan(0);
  });

  it('toggles observation step completion on press', async () => {
    await act(async () => {
      render(<ReadingPacksScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('Field Observation: Saturn & Ring Tilt')).toBeTruthy();
    });

    const checkbox = screen.getByLabelText('Mark Field Observation: Saturn & Ring Tilt complete');
    expect(checkbox).toBeTruthy();

    await act(async () => {
      fireEvent.press(checkbox);
    });

    expect(markExpeditionStepCompleted).toHaveBeenCalledWith(10, 'saturn', 'step-saturn-field-observation', 1);
  });

  it('displays offline banner and disabled download when connection is offline', async () => {
    jest.mocked(useAppSelector).mockImplementation(selector =>
      selector({
        auth: { user: { id: 10, username: 'emilys' } },
        favourites: { favourites: [], pending: {}, mediaRevision: 1, isDownloading: false },
        feed: {
          connection: 'offline',
          metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T12:00:00Z' } },
          legacySyncedAt: null,
        },
      } as never),
    );

    await act(async () => {
      render(<ReadingPacksScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('You’re offline')).toBeTruthy();
      expect(screen.getAllByText('Connect to download the rest of this expedition.').length).toBeGreaterThan(0);
    });
  });

  it('renders required and optional step indicators (Finding 2)', async () => {
    await act(async () => {
      render(<ReadingPacksScreen />);
    });

    await waitFor(() => {
      expect(screen.getAllByText('REQUIRED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('OPTIONAL').length).toBeGreaterThan(0);
    });
  });

  it('opens external source links when clicked (Finding 8)', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    await act(async () => {
      render(<ReadingPacksScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('NASA Astronomy Picture of the Day Archive')).toBeTruthy();
    });

    const link = screen.getByText('NASA Astronomy Picture of the Day Archive');
    await act(async () => {
      fireEvent.press(link);
    });

    expect(openURLSpy).toHaveBeenCalledWith('https://science.nasa.gov/astronomy/');
    openURLSpy.mockRestore();
  });

  it('provides explicit download cancellation and safe abort (Finding 7)', async () => {
    let capturedSignal: AbortSignal | undefined;
    jest.mocked(downloadExpedition).mockImplementation(async (_acc, _exp, signal) => {
      capturedSignal = signal;
      // Simulate ongoing download waiting for abort
      return new Promise((resolve) => {
        signal.addEventListener('abort', () => {
          resolve({ downloadedCount: 0, missingSteps: [], aborted: true });
        });
      });
    });

    await act(async () => {
      render(<ReadingPacksScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('A Tour of Saturn')).toBeTruthy();
    });

    // Start download for Saturn
    const downloadBtns = screen.getAllByText('Download expedition');
    await act(async () => {
      fireEvent.press(downloadBtns[0]);
    });

    // Cancel download button appears
    await waitFor(() => {
      expect(screen.getByText('Cancel download')).toBeTruthy();
    });

    // Tap cancel
    const cancelBtn = screen.getByText('Cancel download');
    await act(async () => {
      fireEvent.press(cancelBtn);
    });

    expect(capturedSignal?.aborted).toBe(true);
  });
});
