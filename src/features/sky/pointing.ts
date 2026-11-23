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
