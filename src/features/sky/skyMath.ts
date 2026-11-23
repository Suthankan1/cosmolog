import {
  Equator, EquatorFromVector, Horizon, MakeTime, Observer, RotateVector, Rotation_EQJ_EQD, Spherical, VectorFromSphere,
} from 'astronomy-engine';
import { fixedObjects, movingBodies, type SkyObjectId } from './catalog';

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface SkyDirection {
  azimuth: number;
  altitude: number;
}

export interface SkyPosition extends SkyDirection {
  id: SkyObjectId;
}

export function calculateSky(location: ObserverLocation, date: Date): SkyPosition[] {
  const observer = new Observer(location.latitude, location.longitude, location.elevation);
  const time = MakeTime(date);
  const rotation = Rotation_EQJ_EQD(time);
  const positions = fixedObjects.map(({ id, ra, dec }) => {
    // Catalog right ascension is in hours and uses the J2000 reference frame.
    const j2000 = VectorFromSphere(new Spherical(dec, ra * 15, 1), time);
    const equatorial = EquatorFromVector(RotateVector(rotation, j2000));
    const { azimuth, altitude } = Horizon(time, observer, equatorial.ra, equatorial.dec);
    return { id, azimuth, altitude };
  });
  for (const { id, body } of movingBodies) {
    const equatorial = Equator(body, time, observer, true, true);
    const { azimuth, altitude } = Horizon(time, observer, equatorial.ra, equatorial.dec);
    positions.push({ id, azimuth, altitude });
  }
  return positions;
}

export function aboveHorizon(positions: readonly SkyPosition[]): SkyPosition[] {
  return positions.filter(position => position.altitude >= 0).sort((a, b) => b.altitude - a.altitude);
}

export const colombo: ObserverLocation = { latitude: 6.9271, longitude: 79.8612, elevation: 0 };

export function parseCoordinates(latitude: string, longitude: string): ObserverLocation | null {
  const decimal = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
  const lat = latitude.trim();
  const lon = longitude.trim();
  if (!decimal.test(lat) || !decimal.test(lon)) return null;
  const a = Number(lat.replace(',', '.'));
  const b = Number(lon.replace(',', '.'));
  return Math.abs(a) <= 90 && Math.abs(b) <= 180 ? { latitude: a, longitude: b, elevation: 0 } : null;
}
