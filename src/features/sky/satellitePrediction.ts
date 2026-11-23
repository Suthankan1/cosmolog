import { degreesToRadians, eciToEcf, ecfToLookAngles, gstime, json2satrec, propagate, radiansToDegrees } from 'satellite.js';
import type { SatelliteCacheEntry } from '../../database/repositories/satelliteOrbitRepository';
import { wrapDegrees } from './projection';
import type { ObserverLocation, SkyPosition } from './skyMath';

const day = 86_400_000;

export function orbitAge(epochAt: number, now: number): 'fresh' | 'older' | 'expired' {
  const age = Math.abs(now - epochAt);
  if (age >= 3 * day) return 'expired';
  return age >= day ? 'older' : 'fresh';
}

export function predictSatellite(row: SatelliteCacheEntry, observer: ObserverLocation, now: number): SkyPosition | null {
  if (!row.elements) return null;
  const { epochAt, data } = row.elements;
  const age = orbitAge(epochAt, now);
  if (age === 'expired') return null;
  const date = new Date(now);
  const result = propagate(json2satrec(data), date);
  if (!result?.position) return null;
  const earthFixed = eciToEcf(result.position, gstime(date));
  const direction = ecfToLookAngles({
    latitude: degreesToRadians(observer.latitude),
    longitude: degreesToRadians(observer.longitude),
    height: observer.elevation / 1000,
  }, earthFixed);
  const altitude = radiansToDegrees(direction.elevation);
  const azimuth = wrapDegrees(radiansToDegrees(direction.azimuth));
  if (!Number.isFinite(altitude) || !Number.isFinite(azimuth)) return null;
  return { id: `satellite:${row.noradId}`, altitude, azimuth, prediction: { epochAt, older: age === 'older' } };
}
