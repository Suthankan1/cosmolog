import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { colombo, type ObserverLocation } from './skyMath';

export type ManualLocation = ObserverLocation & { kind: 'manual' | 'preview'; city?: {name:string; zone:string} };
type DeviceLocation = ObserverLocation & { kind: 'device'; timestamp: number; lastKnown: boolean; approximate: boolean };
export type SkyLocation = ManualLocation | DeviceLocation;
export const previewLocation: ManualLocation = { ...colombo, kind: 'preview' };

type LocationStatus = 'checking' | 'choose' | 'blocked' | 'locating' | 'ready' | 'unavailable' | 'unsupported';
const recentFixAge = 15 * 60_000;
const freshFixAge = 30_000;

function toDeviceLocation(result: Location.LocationObject, lastKnown: boolean): DeviceLocation | null {
  const { latitude, longitude, altitude, accuracy } = result.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(result.timestamp)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return {
    kind: 'device', latitude, longitude, elevation: typeof altitude === 'number' && Number.isFinite(altitude) ? altitude : 0,
    lastKnown, timestamp: result.timestamp,
    approximate: typeof accuracy !== 'number' || accuracy > 1000,
  };
}

export function useSkyLocation(active: boolean) {
  const [manual, setManual] = useState<ManualLocation>();
  const [device, setDevice] = useState<DeviceLocation>();
  const [status, setStatus] = useState<LocationStatus>('checking');
  const [attempt, setAttempt] = useState(0);
  const promptedAttempt = useRef(0);
  const supportsDevice = Platform.OS === 'android' || Platform.OS === 'ios';

  useEffect(() => {
    if (!active || manual || !supportsDevice) return;
    let stopped = false;
    let finished = false;
    let watch: Location.LocationSubscription | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopWatch = () => {
      clearTimeout(timer);
      watch?.remove();
      watch = undefined;
    };
    const finish = (nextStatus: LocationStatus) => {
      if (stopped || finished) return;
      finished = true;
      stopWatch();
      setStatus(nextStatus);
    };

    const getFix = async () => {
      setStatus('checking');
      setDevice(previous => previous && Math.abs(Date.now() - previous.timestamp) <= recentFixAge
        ? { ...previous, lastKnown: true } : undefined);
      const shouldPrompt = attempt > promptedAttempt.current;
      if (shouldPrompt) promptedAttempt.current = attempt;
      let permission = await Location.getForegroundPermissionsAsync();
      if (stopped) return;
      if (!permission.granted && permission.canAskAgain && shouldPrompt) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (stopped) return;
      if (!permission.granted) {
        setDevice(undefined);
        finish(permission.canAskAgain ? 'choose' : 'blocked');
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) {
        if (!stopped) {
          setDevice(undefined);
          finish('unavailable');
        }
        return;
      }
      if (stopped) return;

      setStatus('locating');
      void Location.getLastKnownPositionAsync({ maxAge: recentFixAge }).then(result => {
        if (stopped || finished || !result || Math.abs(Date.now() - result.timestamp) > recentFixAge) return;
        const known = toDeviceLocation(result, true);
        if (known) setDevice(previous => !previous || known.timestamp > previous.timestamp ? known : previous);
      }).catch(() => undefined);

      timer = setTimeout(() => finish('unavailable'), 10_000);
      watch = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false },
        result => {
          if (stopped || finished || Math.abs(Date.now() - result.timestamp) > freshFixAge) return;
          const fresh = toDeviceLocation(result, false);
          if (!fresh) return;
          setDevice(fresh);
          finish('ready');
        },
        () => finish('unavailable'),
      );
      if (stopped || finished) stopWatch();
    };

    void getFix().catch(() => finish('unavailable'));
    return () => {
      stopped = true;
      stopWatch();
    };
  }, [active, attempt, manual, supportsDevice]);

  return {
    location: manual ?? device ?? previewLocation,
    status: supportsDevice ? status : 'unsupported' as const,
    clearRememberedCity: () => setManual(previous => previous?.city ? undefined : previous),
    useLocation: () => {
      setManual(undefined);
      setAttempt(value => value + 1);
    },
    chooseLocation: (location: ManualLocation) => setManual(location),
  };
}
