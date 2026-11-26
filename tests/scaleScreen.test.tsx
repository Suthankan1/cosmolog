import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Linking } from 'react-native';
import ExploreHubScreen from '../app/explore/index';
import CosmicScaleScreen from '../app/explore/scale';
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

describe('Explore Hub Screen with Cosmic Scale Lab (ExploreHubScreen)', () => {
  it('renders both LightTrace and Cosmic Scale Lab cards', async () => {
    await render(<ExploreHubScreen />);

    expect(screen.getByText('LightTrace')).toBeTruthy();
    expect(screen.getByText('Cosmic Scale Lab')).toBeTruthy();
    expect(screen.getByText(/Planetary Diameters & Travel Simulator/)).toBeTruthy();
    expect(screen.getByText(/PLANETARY SCALE · F04/)).toBeTruthy();
  });

  it('navigates to /explore/scale when Cosmic Scale card is pressed', async () => {
    await render(<ExploreHubScreen />);

    const scaleCard = screen.getByLabelText(/Open Cosmic Scale Laboratory/);
    fireEvent.press(scaleCard);

    expect(mockPush).toHaveBeenCalledWith('/explore/scale');
  });
});

describe('Cosmic Scale Screen (CosmicScaleScreen)', () => {
  it('renders masthead, mode tabs, and body carousel', async () => {
    await render(<CosmicScaleScreen />);

    expect(screen.getByText('Cosmic Scale & Distances')).toBeTruthy();
    expect(screen.getByText(/OFFLINE ASTRONOMICAL SCALE LABORATORY · F04/)).toBeTruthy();
    expect(screen.getByText('Diameter')).toBeTruthy();
    expect(screen.getByText('Distance')).toBeTruthy();
    expect(screen.getByText('Travel Time')).toBeTruthy();

    expect(screen.getAllByText('The Sun').length).toBeGreaterThan(0);
    expect(screen.getByText('Mercury')).toBeTruthy();
    expect(screen.getByText('Venus')).toBeTruthy();
    expect(screen.getAllByText('Earth').length).toBeGreaterThan(0);
    expect(screen.getAllByText('The Moon').length).toBeGreaterThan(0);
    expect(screen.getByText('Mars')).toBeTruthy();
    expect(screen.getAllByText('Jupiter').length).toBeGreaterThan(0);
    expect(screen.getByText('Saturn')).toBeTruthy();
  });

  describe('Diameter Mode', () => {
    it('displays default Earth diameter metrics and 1.00x self-ratio', async () => {
      await render(<CosmicScaleScreen />);

      expect(screen.getAllByText('12,742 km').length).toBeGreaterThan(0);
      expect(screen.getByText('1.00×')).toBeTruthy();
      expect(screen.getByText(/standard reference body for terrestrial planetary diameter/)).toBeTruthy();
    });

    it('updates metrics and calculates diameter ratio when switching to Jupiter', async () => {
      await render(<CosmicScaleScreen />);

      const jupiterChip = screen.getByLabelText('Jupiter, planet');
      await act(async () => {
        fireEvent.press(jupiterChip);
      });

      expect(screen.getAllByText('139,820 km').length).toBeGreaterThan(0);
      expect(screen.getByText('10.97×')).toBeTruthy();
      expect(screen.getByText(/The Solar System’s king planet/)).toBeTruthy();
    });

    it('recalculates ratio when changing comparison reference body', async () => {
      await render(<CosmicScaleScreen />);

      // Switch target to Sun
      const sunChip = screen.getByLabelText('The Sun, star');
      await act(async () => {
        fireEvent.press(sunChip);
      });

      expect(screen.getAllByText('1,392,700 km').length).toBeGreaterThan(0);
      expect(screen.getByText('109.30×')).toBeTruthy(); // Sun / Earth

      // Switch reference baseline to Moon
      const moonBaselineBtn = screen.getByLabelText('Set comparison baseline to The Moon');
      await act(async () => {
        fireEvent.press(moonBaselineBtn);
      });

      // Sun / Moon = 1,392,700 / 3,475 = 400.78x
      expect(screen.getByText('400.78×')).toBeTruthy();
    });
  });

  describe('Distance Mode', () => {
    it('switches to Distance mode and shows heliocentric semi-major axis by default', async () => {
      await render(<CosmicScaleScreen />);

      const distanceTab = screen.getByLabelText('Distance Comparison Mode');
      await act(async () => {
        fireEvent.press(distanceTab);
      });

      expect(screen.getByText('SEMI-MAJOR AXIS (MEAN DISTANCE FROM SUN)')).toBeTruthy();
      expect(screen.getAllByText('1.000 AU').length).toBeGreaterThan(0);
    });

    it('toggles to geocentric distance and displays separation from Earth', async () => {
      await render(<CosmicScaleScreen />);

      // Switch to Distance mode
      const distanceTab = screen.getByLabelText('Distance Comparison Mode');
      await act(async () => {
        fireEvent.press(distanceTab);
      });

      // Select Mars
      const marsChip = screen.getByLabelText('Mars, planet');
      await act(async () => {
        fireEvent.press(marsChip);
      });

      // Toggle to From Earth
      const earthToggleBtn = screen.getByLabelText('Show distance from Earth (geocentric variable distance)');
      await act(async () => {
        fireEvent.press(earthToggleBtn);
      });

      expect(screen.getByText('AVERAGE DISTANCE FROM EARTH')).toBeTruthy();
      expect(screen.getByText('225.0 million km')).toBeTruthy();
      expect(screen.getByText(/Approaches from 54.6 million km to 401.0 million km/)).toBeTruthy();
    });
  });

  describe('Travel Time Simulator Mode', () => {
    it('switches to Travel Time mode and computes duration with speed preset', async () => {
      await render(<CosmicScaleScreen />);

      const travelTab = screen.getByLabelText('Travel Time Simulator Mode');
      await act(async () => {
        fireEvent.press(travelTab);
      });

      expect(screen.getByText('ESTIMATED STRAIGHT-LINE TRAVEL TIME')).toBeTruthy();
      expect(screen.getByText(/Voyager 1 Outbound/)).toBeTruthy();
      expect(screen.getByText(/Parker Solar Probe \(Peak\)/)).toBeTruthy();
      expect(screen.getByText(/Orbital Mechanics Scope & Limitations/)).toBeTruthy();
    });

    it('selects Parker Solar Probe speed and updates travel time', async () => {
      await render(<CosmicScaleScreen />);

      const travelTab = screen.getByLabelText('Travel Time Simulator Mode');
      await act(async () => {
        fireEvent.press(travelTab);
      });

      // Select Saturn as target
      const saturnChip = screen.getByLabelText('Saturn, planet');
      await act(async () => {
        fireEvent.press(saturnChip);
      });

      // Select Parker Solar Probe (692,000 km/h)
      const parkerBtn = screen.getByLabelText(/Parker Solar Probe \(Peak\)/);
      await act(async () => {
        fireEvent.press(parkerBtn);
      });

      // 1,275,000,000 km / 692,000 km/h = 1,842.48 hours = 76.77 days
      expect(screen.getByText('76.8 days')).toBeTruthy();
    });

    it('validates custom speed input and flags velocities exceeding c', async () => {
      await render(<CosmicScaleScreen />);

      const travelTab = screen.getByLabelText('Travel Time Simulator Mode');
      await act(async () => {
        fireEvent.press(travelTab);
      });

      // Enable custom speed checkbox
      const customCheckbox = screen.getByLabelText('Enter custom travel speed in km/h');
      await act(async () => {
        fireEvent.press(customCheckbox);
      });

      const customInput = screen.getByLabelText('Custom speed in kilometres per hour');

      // Enter speed faster than light (> 1,079,252,848.8 km/h)
      await act(async () => {
        fireEvent.changeText(customInput, '2000000000');
      });

      expect(screen.getByText(/Speed must be strictly below the speed of light c/)).toBeTruthy();
    });
  });

  describe('External Sources and Cross-Feature Deep Links', () => {
    it('opens external NASA source when pressed', async () => {
      const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

      await render(<CosmicScaleScreen />);

      const sourceLink = screen.getByText('Earth Fact Sheet');
      await act(async () => {
        fireEvent.press(sourceLink);
      });

      expect(canOpenSpy).toHaveBeenCalledWith('https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html');
      expect(openSpy).toHaveBeenCalledWith('https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html');
    });

    it('navigates to related Space Study chapter', async () => {
      await render(<CosmicScaleScreen />);

      const studyBtn = screen.getByLabelText('Open Space Study chapter for Earth');
      await act(async () => {
        fireEvent.press(studyBtn);
      });

      expect(mockPush).toHaveBeenCalledWith('/study/chapter:sun-earth-moon');
    });

    it('navigates to related Expedition for Saturn', async () => {
      await render(<CosmicScaleScreen />);

      const saturnChip = screen.getByLabelText('Saturn, planet');
      await act(async () => {
        fireEvent.press(saturnChip);
      });

      const expeditionBtn = screen.getByLabelText('Open related Expedition for Saturn');
      await act(async () => {
        fireEvent.press(expeditionBtn);
      });

      expect(mockPush).toHaveBeenCalledWith('/reading-packs');
    });

    it('navigates to Sky Viewer for celestial body', async () => {
      await render(<CosmicScaleScreen />);

      const moonChip = screen.getByLabelText('The Moon, moon');
      await act(async () => {
        fireEvent.press(moonChip);
      });

      const skyBtn = screen.getByLabelText('View The Moon in the local Sky Viewer');
      await act(async () => {
        fireEvent.press(skyBtn);
      });

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/sky-viewer',
        params: { target: 'body:Moon' },
      });
    });
  });
});
