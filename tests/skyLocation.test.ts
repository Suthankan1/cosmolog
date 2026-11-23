import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useSkyLocation } from '../src/features/sky/useSkyLocation';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

const provider = jest.mocked(Location);
const granted = { granted: true, canAskAgain: true, expires: 'never', status: Location.PermissionStatus.GRANTED } as const;
const denied = { ...granted, granted: false, status: Location.PermissionStatus.DENIED };
const fix = (age: number): Location.LocationObject => ({
  timestamp: Date.now() - age,
  coords: { latitude: 6.9, longitude: 79.9, altitude: null, accuracy: 100, altitudeAccuracy: null, heading: null, speed: null },
});

beforeEach(() => {
  jest.resetAllMocks();
  provider.hasServicesEnabledAsync.mockResolvedValue(true);
  provider.getLastKnownPositionAsync.mockResolvedValue(null);
});

it('keeps the preview usable until a user explicitly grants location and a fix arrives', async () => {
  const remove = jest.fn();
  let onFix: Location.LocationCallback | undefined;
  provider.getForegroundPermissionsAsync.mockResolvedValue(denied);
  provider.requestForegroundPermissionsAsync.mockResolvedValue(granted);
  provider.watchPositionAsync.mockImplementation(async (_options, callback) => {
    onFix = callback;
    return { remove };
  });

  const { result } = await renderHook(() => useSkyLocation(true));
  await waitFor(() => expect(result.current.status).toBe('choose'));
  expect(result.current.location.kind).toBe('preview');
  expect(provider.requestForegroundPermissionsAsync).not.toHaveBeenCalled();

  await act(async () => { result.current.useLocation(); });
  expect(provider.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  await act(async () => { onFix?.(fix(0)); });
  expect(result.current.location).toMatchObject({ kind: 'device', latitude: 6.9, lastKnown: false });
  expect(remove).toHaveBeenCalledTimes(1);
});

it('uses a recent cached fix and discards a late fresh fix after leaving the viewer', async () => {
  const remove = jest.fn();
  let onFix: Location.LocationCallback | undefined;
  provider.getForegroundPermissionsAsync.mockResolvedValue(granted);
  provider.getLastKnownPositionAsync.mockResolvedValue(fix(60_000));
  provider.watchPositionAsync.mockImplementation(async (_options, callback) => {
    onFix = callback;
    return { remove };
  });
  const { result, rerender } = await renderHook<ReturnType<typeof useSkyLocation>, { active: boolean }>(
    ({ active }) => useSkyLocation(active), { initialProps: { active: true } },
  );
  await waitFor(() => expect(result.current.location).toMatchObject({ kind: 'device', lastKnown: true }));
  await rerender({ active: false });
  await act(async () => { onFix?.(fix(0)); });
  expect(result.current.location).toMatchObject({ kind: 'device', lastKnown: true });
  expect(remove).toHaveBeenCalledTimes(1);
  expect(provider.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});
