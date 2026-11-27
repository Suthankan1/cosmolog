import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import MeteorCalendarScreen from '../app/events/meteors';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock('../src/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      feed: {
        connection: 'online',
        metadata: {
          'nasa-apod': { lastSyncedAt: '2026-11-27T08:00:00.000Z' },
        },
        legacySyncedAt: null,
      },
    }),
}));

describe('MeteorCalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders masthead, ZHR explanation caveat, filter chips, and shower cards', async () => {
    await render(<MeteorCalendarScreen />);

    expect(screen.getByText('ANNUAL ASTRONOMICAL CALENDAR · F10')).toBeTruthy();
    expect(screen.getByText('Meteor Showers 2026')).toBeTruthy();
    expect(screen.getByText(/Zenithal Hourly Rate \(ZHR\) is an idealized theoretical rate/)).toBeTruthy();

    // Check filter chips
    expect(screen.getByText('All Showers')).toBeTruthy();
    expect(screen.getByText('Active & Peak')).toBeTruthy();
    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.getByText('Past')).toBeTruthy();

    // Major showers visible
    expect(screen.getByText('Geminids')).toBeTruthy();
    expect(screen.getByText('Perseids')).toBeTruthy();
    expect(screen.getByText('Quadrantids')).toBeTruthy();
  });

  it('navigates to observation journal creation with prefilled shower target when Log Observation is tapped', async () => {
    await render(<MeteorCalendarScreen />);

    const logButtons = screen.getAllByText('Log observation');
    expect(logButtons.length).toBeGreaterThan(0);

    fireEvent.press(logButtons[0]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/fieldwork/create',
        params: expect.objectContaining({
          targetId: expect.stringContaining('meteor:'),
        }),
      })
    );
  });

  it('navigates to Sky Viewer radiant when Locate Radiant is tapped', async () => {
    await render(<MeteorCalendarScreen />);

    const locateButtons = screen.getAllByText('Locate radiant');
    expect(locateButtons.length).toBeGreaterThan(0);

    fireEvent.press(locateButtons[0]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/sky-viewer',
        params: expect.objectContaining({
          target: expect.any(String),
        }),
      })
    );
  });

  it('filters list when a filter chip is pressed', async () => {
    await render(<MeteorCalendarScreen />);

    fireEvent.press(screen.getByText('Upcoming'));
    // List remains rendered and responsive
    expect(screen.getByText('Meteor Showers 2026')).toBeTruthy();
  });
});
