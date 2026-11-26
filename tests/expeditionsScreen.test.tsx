import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import ReadingPacksScreen from '../app/reading-packs';
import { getReadingPackItems } from '../src/database/repositories/readingPacksRepository';
import {
  getAllCompletedStepIds,
  markExpeditionStepCompleted,
} from '../src/database/repositories/expeditionsRepository';
import { useAppDispatch, useAppSelector } from '../src/store';

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

    expect(screen.getAllByText(/Sources & Credits:/).length).toBeGreaterThan(0);
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

    expect(markExpeditionStepCompleted).toHaveBeenCalledWith(10, 'saturn', 'step-saturn-field-observation');
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
});
