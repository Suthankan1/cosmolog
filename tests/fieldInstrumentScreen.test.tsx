import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import CelestialInstrumentScreen from '../app/fieldwork/instrument';
import { useAppSelector } from '../src/store';
import { useSkyPointing } from '../src/features/sky/useSkyPointing';

jest.mock('../src/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: () => jest.fn(),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => {
  const actualReact = jest.requireActual('react');
  return {
    useRouter: () => ({
      push: mockPush,
      replace: jest.fn(),
      back: mockBack,
    }),
    useLocalSearchParams: () => mockParams,
    useIsFocused: () => true,
    useFocusEffect: (cb: () => void) => {
      actualReact.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});

jest.mock('../src/features/sky/useSkyPointing');
jest.mock('../src/features/sky/useRememberedLocation', () => ({
  useRememberedLocation: () => ({
    location: { kind: 'manual', city: { name: 'Colombo', zone: 'Asia/Colombo' }, latitude: 6.9271, longitude: 79.8612, elevation: 0 },
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
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

  jest.mocked(useSkyPointing).mockReturnValue({
    status: 'ready',
    azimuth: 142.4,
    altitude: 38.5,
    cardinal: 'SE',
    reference: 'true',
    quality: 'calibrated',
    timestamp: 1700000000000,
    declination: 3.2,
    fieldStrength: 42.5,
    view: {
      forward: { x: 0.5, y: 0.6, z: 0.62 },
      right: { x: 0.8, y: -0.6, z: 0 },
      up: { x: 0.36, y: 0.5, z: -0.78 },
    },
  });
});

describe('Celestial Field Instrument Screen (F06)', () => {
  it('renders masthead, solar safety warning, compass dial, and telemetry', async () => {
    await render(<CelestialInstrumentScreen />);

    expect(screen.getByText('Night Sky Field Instrument')).toBeTruthy();
    expect(screen.getByText(/ASTRONOMICAL HEADING & INCLINATION · F06/)).toBeTruthy();
    expect(screen.getByText('SOLAR OBSERVING SAFETY WARNING')).toBeTruthy();
    expect(screen.getByText(/Never view the Sun directly/)).toBeTruthy();

    // Dial text
    expect(screen.getByText('142.4°')).toBeTruthy();
    expect(screen.getByText('SE')).toBeTruthy();
    expect(screen.getByText('+38.5° Alt')).toBeTruthy();
    expect(screen.getByText('TRUE NORTH')).toBeTruthy();

    // Telemetry
    expect(screen.getByText('Scientific Telemetry & Reference')).toBeTruthy();
    expect(screen.getByText('142.40° (SE)')).toBeTruthy();
    expect(screen.getByText('+38.50°')).toBeTruthy();
    expect(screen.getByText(/True North \(Declination: \+3.2°\)/)).toBeTruthy();
    expect(screen.getByText('CALIBRATED')).toBeTruthy();
    expect(screen.getByText('42.5 µT (Normal: 25–65 µT)')).toBeTruthy();
  });

  it('renders prominent cautionary state when target is the Sun', async () => {
    mockParams = { targetId: 'body:Sun', targetName: 'Sun' };

    await render(<CelestialInstrumentScreen />);

    expect(screen.getByText('Target Tracking: SUN')).toBeTruthy();
    expect(screen.getByText('SOLAR OBSERVING SAFETY WARNING')).toBeTruthy();
  });

  it('switches to manual mode and adjusts azimuth and elevation via steppers', async () => {
    await render(<CelestialInstrumentScreen />);

    // Switch to manual mode
    const manualPill = screen.getByLabelText('Switch to manual direction controls');
    await act(async () => {
      fireEvent.press(manualPill);
    });

    expect(screen.getByText('Manual Sighting Controls')).toBeTruthy();
    expect(screen.getAllByText('MANUAL').length).toBeGreaterThanOrEqual(1);

    // Step azimuth by +15°
    const plus15Btn = screen.getByLabelText('Increase azimuth by 15 degrees');
    await act(async () => {
      fireEvent.press(plus15Btn);
    });

    // 180 + 15 = 195
    expect(screen.getByDisplayValue('195.0')).toBeTruthy();
    expect(screen.getByText('195.0°')).toBeTruthy();

    // Step elevation by -10°
    const minus10Btn = screen.getByLabelText('Decrease elevation by 10 degrees');
    await act(async () => {
      fireEvent.press(minus10Btn);
    });

    // 30 - 10 = 20
    expect(screen.getByDisplayValue('20.0')).toBeTruthy();
    expect(screen.getByText('+20.0° Alt')).toBeTruthy();
  });

  it('captures measurement snapshot and navigates to observation creator', async () => {
    mockParams = { targetId: 'body:Saturn', targetName: 'Saturn' };

    await render(<CelestialInstrumentScreen />);

    const captureBtn = screen.getByLabelText('Capture current instrument reading into a new observation log');
    await act(async () => {
      fireEvent.press(captureBtn);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/fieldwork/create',
      params: {
        targetId: 'body:Saturn',
        targetName: 'Saturn',
        prefilledNotes: expect.stringContaining('142.4° SE'),
        snapshotJson: expect.stringContaining('"azimuth":142.4'),
      },
    });
  });

  it('displays calibration copy when sensors are calibrating', async () => {
    jest.mocked(useSkyPointing).mockReturnValue({
      status: 'calibrating',
    });

    await render(<CelestialInstrumentScreen />);

    expect(screen.getByText(/Calibrating sensors... Hold device steady/)).toBeTruthy();
  });

  it('displays unavailable copy when sensors are unavailable', async () => {
    jest.mocked(useSkyPointing).mockReturnValue({
      status: 'unavailable',
    });

    await render(<CelestialInstrumentScreen />);

    expect(screen.getByText(/Sensors unavailable on this device/)).toBeTruthy();
  });
});
