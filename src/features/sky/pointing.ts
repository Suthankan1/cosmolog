import { cross, dot, radians, wrapDegrees, type Vector3, type ViewDirection } from './projection';

function unit(vector: Vector3, minimum: number): Vector3 | null {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (!Number.isFinite(length) || length < minimum) return null;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

export function magneticDeclination(trueHeading: number, magneticHeading: number, accuracy: number): number | null {
  if (!Number.isFinite(trueHeading) || !Number.isFinite(magneticHeading) || !Number.isFinite(accuracy)
    || trueHeading === -1 || trueHeading < -180 || trueHeading >= 360
    || magneticHeading < 0 || magneticHeading >= 360 || accuracy < 2) return null;
  return wrapDegrees(trueHeading - magneticHeading + 180) - 180;
}

export type InstrumentReference = 'true' | 'magnetic' | 'unknown';
export type InstrumentQuality = 'calibrated' | 'uncalibrated' | 'interference' | 'stale' | 'manual';
export type InstrumentStatus = 'ready' | 'calibrating' | 'unavailable' | 'manual';

export interface InstrumentReading {
  status: InstrumentStatus;
  azimuth: number;
  altitude: number;
  cardinal: string;
  reference: InstrumentReference;
  quality: InstrumentQuality;
  timestamp: number;
  declination: number | null;
  fieldStrength: number | null;
  view: ViewDirection | null;
}

export function cardinalDirection(azimuth: number): string {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(wrapDegrees(azimuth) / 22.5) % 16;
  return cardinals[index];
}

export function anglesFromView(view: ViewDirection): { azimuth: number; altitude: number } {
  const f = view.forward;
  const altitude = Math.asin(Math.max(-1, Math.min(1, f.z))) * (180 / Math.PI);
  const cosAlt = Math.cos(altitude * radians);
  let azimuth = 0;
  if (Math.abs(cosAlt) > 1e-4) {
    azimuth = wrapDegrees(Math.atan2(f.x, f.y) * (180 / Math.PI));
  }
  return { azimuth, altitude };
}

export function viewFromSensors(gravity: Vector3, field: Vector3, declination: number): ViewDirection | null {
  const worldUp = unit({ x: -gravity.x, y: -gravity.y, z: -gravity.z }, 4);
  const fieldStrength = Math.hypot(field.x, field.y, field.z);
  if (!worldUp || !Number.isFinite(fieldStrength) || fieldStrength < 15 || fieldStrength > 100) return null;
  const vertical = dot(worldUp, field);
  const magneticNorth = unit({
    x: field.x - worldUp.x * vertical,
    y: field.y - worldUp.y * vertical,
    z: field.z - worldUp.z * vertical,
  }, 3);
  if (!magneticNorth) return null;
  const magneticEast = cross(magneticNorth, worldUp);
  const angle = declination * radians;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const toTrueNorth = (magEast: number, magNorth: number, up: number) => ({
    x: cos * magEast + sin * magNorth,
    y: cos * magNorth - sin * magEast,
    z: up,
  });
  // For portrait, +X is screen-right, +Y is screen-up and -Z is away from the viewer.
  return {
    right: toTrueNorth(magneticEast.x, magneticNorth.x, worldUp.x),
    up: toTrueNorth(magneticEast.y, magneticNorth.y, worldUp.y),
    forward: toTrueNorth(-magneticEast.z, -magneticNorth.z, -worldUp.z),
  };
}

export function deriveInstrumentReading(
  gravity: Vector3 | undefined,
  field: Vector3 | undefined,
  declination: number | null,
  now: number,
  lastMotion: number,
  lastField: number,
): {
  status: 'ready';
  azimuth: number;
  altitude: number;
  cardinal: string;
  reference: InstrumentReference;
  quality: InstrumentQuality;
  timestamp: number;
  declination: number | null;
  fieldStrength: number;
  view: ViewDirection;
} | {
  status: 'calibrating' | 'unavailable';
  reason?: 'missing' | 'stale' | 'interference';
  fieldStrength?: number;
} {
  if (!gravity || !field) {
    return { status: 'calibrating', reason: 'missing' };
  }

  const fieldStrength = Math.hypot(field.x, field.y, field.z);
  if (!Number.isFinite(fieldStrength) || fieldStrength < 15 || fieldStrength > 100) {
    return { status: 'calibrating', reason: 'interference', fieldStrength };
  }

  const isStale = now - lastMotion >= 1500 || now - lastField >= 1500;
  if (isStale) {
    return { status: 'calibrating', reason: 'stale', fieldStrength };
  }

  const effectiveDeclination = declination ?? 0;
  const view = viewFromSensors(gravity, field, effectiveDeclination);
  if (!view) {
    return { status: 'calibrating', reason: 'interference', fieldStrength };
  }

  const { azimuth, altitude } = anglesFromView(view);
  const reference: InstrumentReference = declination !== null ? 'true' : 'magnetic';
  const quality: InstrumentQuality = declination !== null ? 'calibrated' : 'uncalibrated';

  return {
    status: 'ready',
    azimuth,
    altitude,
    cardinal: cardinalDirection(azimuth),
    reference,
    quality,
    timestamp: Math.max(lastMotion, lastField),
    declination,
    fieldStrength,
    view,
  };
}
