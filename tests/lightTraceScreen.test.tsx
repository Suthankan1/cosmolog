import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Linking } from 'react-native';
import ExploreHubScreen from '../app/explore/index';
import LightTraceScreen from '../app/explore/lighttrace';
import { useAppSelector } from '../src/store';

jest.mock('../src/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: () => jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAppSelector).mockImplementation(selector =>
    selector({
      auth: { user: { id: 10, username: 'emilys' } },
      feed: {
        connection: 'online',
        metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T12:00:00Z' } },
        legacySyncedAt: null,
      },
    } as never),
  );
});

describe('Explore Hub Screen (ExploreHubScreen)', () => {
  it('renders laboratory title, summary and LightTrace lab card', async () => {
    await render(<ExploreHubScreen />);

    expect(screen.getByText('Cosmic Exploration')).toBeTruthy();
    expect(screen.getByText(/Interactive astronomical laboratories/i)).toBeTruthy();
    expect(screen.getByText('LightTrace')).toBeTruthy();
    expect(screen.getByText(/Cosmic Light-Travel & Distance Explorer/)).toBeTruthy();
    expect(screen.getByText(/Exact vacuum c: 299,792,458 m\/s/)).toBeTruthy();
  });

  it('navigates to /explore/lighttrace when LightTrace card is pressed', async () => {
    await render(<ExploreHubScreen />);

    const card = screen.getByLabelText(/Open LightTrace laboratory/);
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalledWith('/explore/lighttrace');
  });
});

describe('LightTrace Screen (LightTraceScreen)', () => {
  it('renders masthead and all celestial target tabs', async () => {
    await render(<LightTraceScreen />);

    expect(screen.getByText('The Speed of Starlight')).toBeTruthy();
    expect(screen.getAllByText('The Moon').length).toBeGreaterThan(0);
    expect(screen.getByText('The Sun')).toBeTruthy();
    expect(screen.getByText('Proxima Centauri')).toBeTruthy();
    expect(screen.getByText('Andromeda Galaxy (M31)')).toBeTruthy();
  });

  it('displays default Moon light-travel duration and distance metrics (~1.3 seconds)', async () => {
    await render(<LightTraceScreen />);

    // Default target: The Moon
    expect(screen.getByText('1.3 seconds')).toBeTruthy();
    expect(screen.getByText(/Slightly longer than a single human resting heartbeat/)).toBeTruthy();
    expect(screen.getAllByText('384,400 km').length).toBeGreaterThan(0);
    expect(screen.getByText('Geocentric mean lunar orbit')).toBeTruthy();
  });

  it('switches target to The Sun and updates calculation to ~8.3 minutes on tab press', async () => {
    await render(<LightTraceScreen />);

    const sunTab = screen.getByLabelText(/The Sun/);
    await act(async () => {
      fireEvent.press(sunTab);
    });

    expect(screen.getByText('8.3 minutes')).toBeTruthy();
    expect(screen.getAllByText('149,597,871 km').length).toBeGreaterThan(0);
    expect(screen.getByText(/Heliocentric mean orbital radius/)).toBeTruthy();
  });

  it('steps through targets using previous and next stepper buttons', async () => {
    await render(<LightTraceScreen />);

    // Initially at Moon (index 0)
    expect(screen.getByText('1.3 seconds')).toBeTruthy();

    // Tap next -> Sun (index 1)
    const nextBtn = screen.getByLabelText('Next celestial target');
    await act(async () => {
      fireEvent.press(nextBtn);
    });
    expect(screen.getByText('8.3 minutes')).toBeTruthy();

    // Tap next -> Proxima Centauri (index 2)
    await act(async () => {
      fireEvent.press(nextBtn);
    });
    expect(screen.getByText('4.25 years')).toBeTruthy();

    // Tap prev -> back to Sun
    const prevBtn = screen.getByLabelText('Previous celestial target');
    await act(async () => {
      fireEvent.press(prevBtn);
    });
    expect(screen.getByText('8.3 minutes')).toBeTruthy();
  });

  it('renders scientific assumptions disclosure regarding local vacuum vs cosmic expansion', async () => {
    await render(<LightTraceScreen />);

    expect(screen.getByText('Physical Scope & Model Assumptions')).toBeTruthy();
    expect(screen.getByText(/metric expansion of cosmological spacetime/)).toBeTruthy();
  });

  it('opens external authoritative source when link is pressed', async () => {
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

    await render(<LightTraceScreen />);

    const sourceLink = screen.getByText('Basics of Space Flight — Solar System');
    await act(async () => {
      fireEvent.press(sourceLink);
    });

    expect(canOpenSpy).toHaveBeenCalledWith('https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/');
    expect(openSpy).toHaveBeenCalledWith('https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/');
  });

  it('navigates to related Space Study chapter when requested', async () => {
    await render(<LightTraceScreen />);

    const studyBtn = screen.getByLabelText(/Open related Space Study guide for The Moon/);
    await act(async () => {
      fireEvent.press(studyBtn);
    });

    expect(mockPush).toHaveBeenCalledWith('/study/chapter:sun-earth-moon');
  });

  it('navigates to Sky Viewer when requested', async () => {
    await render(<LightTraceScreen />);

    const skyBtn = screen.getByLabelText(/View The Moon in the local Sky Viewer/);
    await act(async () => {
      fireEvent.press(skyBtn);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/sky-viewer',
      params: { target: 'body:Moon' },
    });
  });
});
