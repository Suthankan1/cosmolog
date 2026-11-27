import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TimelineScreen from '../app/timeline/index';
import { getTimelineItems } from '../src/features/timeline/timelineRepository';
import { TimelineItem } from '../src/features/timeline/types';

jest.mock('../src/features/timeline/timelineRepository', () => ({
  getTimelineItems: jest.fn(),
}));

const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock('expo-router', () => {
  const actualReact = jest.requireActual('react');
  return {
    useRouter: () => ({
      push: mockPush,
      navigate: mockNavigate,
      back: jest.fn(),
    }),
    useFocusEffect: (cb: () => void) => {
      actualReact.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});

jest.mock('../src/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: { user: { id: 1, username: 'astronomer' } },
      feed: {
        connection: 'online',
        metadata: {
          'nasa-apod': { lastSyncedAt: '2026-11-27T08:00:00.000Z' },
        },
        legacySyncedAt: null,
      },
    }),
}));

describe('TimelineScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleItems: TimelineItem[] = [
    {
      id: 'observation:obs_1',
      sourceRecordId: 'obs_1',
      kind: 'observation',
      eventAt: '2026-11-27T10:00:00.000Z',
      dateKind: 'observed',
      title: 'Jupiter Cloud Belts',
      summary: 'Equatorial bands visible with 8-inch Dobsonian',
      label: 'OBSERVATION',
      routeRef: { pathname: '/fieldwork/[id]', params: { id: 'obs_1' } },
      metadata: {
        conditions: 'Clear, Bortle 4',
      },
    },
    {
      id: 'discovery_saved:apod_1',
      sourceRecordId: 'apod_1',
      kind: 'discovery_saved',
      eventAt: '2026-11-26T14:00:00.000Z',
      dateKind: 'saved',
      title: 'Pillars of Creation',
      summary: 'Eagle Nebula nursery',
      label: 'SAVED DISCOVERY',
      routeRef: { pathname: '/details/[source]/[id]', params: { source: 'nasa-apod', id: 'ext_apod_1' } },
      metadata: {
        publishedAt: '2026-10-01T00:00:00.000Z',
        source: 'nasa-apod',
      },
    },
  ];

  it('renders timeline masthead, filters, and records with proper accessible badges', async () => {
    (getTimelineItems as jest.Mock).mockResolvedValue({
      items: sampleItems,
      nextCursor: null,
      totalCount: 2,
    });

    await render(<TimelineScreen />);

    expect(screen.getByText('Your Cosmic Journey')).toBeTruthy();
    expect(screen.getByText('PERSONAL SKY TIMELINE · F09')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Jupiter Cloud Belts')).toBeTruthy();
      expect(screen.getByText('Pillars of Creation')).toBeTruthy();
    });

    expect(screen.getByText('OBSERVATION')).toBeTruthy();
    expect(screen.getByText('SAVED DISCOVERY')).toBeTruthy();
  });

  it('navigates to typed observation details when an observation card is tapped', async () => {
    (getTimelineItems as jest.Mock).mockResolvedValue({
      items: sampleItems,
      nextCursor: null,
      totalCount: 2,
    });

    await render(<TimelineScreen />);

    await waitFor(() => {
      expect(screen.getByText('Jupiter Cloud Belts')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Jupiter Cloud Belts'));
    expect(mockPush).toHaveBeenCalledWith('/fieldwork/obs_1');
  });

  it('navigates to typed discovery details when a saved card is tapped', async () => {
    (getTimelineItems as jest.Mock).mockResolvedValue({
      items: sampleItems,
      nextCursor: null,
      totalCount: 2,
    });

    await render(<TimelineScreen />);

    await waitFor(() => {
      expect(screen.getByText('Pillars of Creation')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Pillars of Creation'));
    expect(mockPush).toHaveBeenCalledWith('/details/nasa-apod/ext_apod_1');
  });

  it('renders empty state when no timeline records exist', async () => {
    (getTimelineItems as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });

    await render(<TimelineScreen />);

    await waitFor(() => {
      expect(screen.getByText('No journey records found')).toBeTruthy();
    });
  });
});
