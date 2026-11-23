import { watchHeadingAsync, type LocationSubscription } from 'expo-location';
import { DeviceMotion, Magnetometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { magneticDeclination, viewFromSensors } from './pointing';
import type { Vector3, ViewDirection } from './projection';

type PointingState =
  | { status: 'calibrating' | 'unavailable' }
  | { status: 'ready'; view: ViewDirection };

function smooth(previous: Vector3 | undefined, next: Vector3): Vector3 {
  if (!previous) return next;
  const weight = 0.45;
  return {
    x: previous.x + (next.x - previous.x) * weight,
    y: previous.y + (next.y - previous.y) * weight,
    z: previous.z + (next.z - previous.z) * weight,
  };
}

export function useSkyPointing(enabled: boolean, reducedMotion: boolean): PointingState {
  const [state, setState] = useState<PointingState>({ status: 'calibrating' });

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let headingWatch: LocationSubscription | undefined;
    const subscriptions: { remove: () => void }[] = [];
    let timer: ReturnType<typeof setInterval> | undefined;
    let declination: number | null = null;
    let gravity: Vector3 | undefined;
    let field: Vector3 | undefined;
    let lastMotion = 0;
    let lastField = 0;
    let lastRender = 0;
    const interval = reducedMotion ? 150 : 50;
    const mark = (status: 'calibrating' | 'unavailable') => setState(current => current.status === status ? current : { status });
    const startedAt = Date.now();

    const update = () => {
      const now = Date.now();
      if (stopped || now - lastRender < interval) return;
      lastRender = now;
      const sensorsFresh = now - lastMotion < 1500 && now - lastField < 1500;
      const view = sensorsFresh && gravity && field && declination !== null ? viewFromSensors(gravity, field, declination) : null;
      if (view) setState({ status: 'ready', view });
      else mark(!sensorsFresh && now - startedAt > 3000 ? 'unavailable' : 'calibrating');
    };

    const start = async () => {
      mark('calibrating');
      const [motionAvailable, fieldAvailable] = await Promise.all([DeviceMotion.isAvailableAsync(), Magnetometer.isAvailableAsync()]);
      if (stopped) return;
      if (!motionAvailable || !fieldAvailable) {
        mark('unavailable');
        return;
      }
      DeviceMotion.setUpdateInterval(interval);
      Magnetometer.setUpdateInterval(interval);
      subscriptions.push(Magnetometer.addListener(data => {
        field = reducedMotion ? data : smooth(field, data);
        lastField = Date.now();
        update();
      }));
      subscriptions.push(DeviceMotion.addListener(({ acceleration, accelerationIncludingGravity: combined }) => {
        if (!acceleration || !combined) return;
        // Removing linear acceleration gives the gravity vector on both native platforms.
        const sample = { x: combined.x - acceleration.x, y: combined.y - acceleration.y, z: combined.z - acceleration.z };
        gravity = reducedMotion ? sample : smooth(gravity, sample);
        lastMotion = Date.now();
        update();
      }));
      timer = setInterval(update, 500);
      headingWatch = await watchHeadingAsync(({ trueHeading, magHeading, accuracy }) => {
        declination = magneticDeclination(trueHeading, magHeading, accuracy);
        update();
      }, () => { declination = null; });
      if (stopped) headingWatch.remove();
    };

    const dispose = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      subscriptions.forEach(subscription => subscription.remove());
      headingWatch?.remove();
    };
    void start().catch(() => {
      if (!stopped) {
        mark('unavailable');
        dispose();
      }
    });
    return dispose;
  }, [enabled, reducedMotion]);

  return enabled ? state : { status: 'calibrating' };
}
