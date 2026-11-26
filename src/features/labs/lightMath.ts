import type { DistanceUnit } from './data/lighttrace';

// BIPM definition of the metre: speed of light in vacuum is exactly 299,792,458 m/s (S01)
export const SPEED_OF_LIGHT_VACUUM_MPS = 299792458;

// Exact astronomical definitions (IAU)
export const METERS_PER_KM = 1000;
export const METERS_PER_AU = 149597870700;
export const METERS_PER_LIGHT_YEAR = 9460730472580800; // 365.25 days * 86400 s/day * c
export const METERS_PER_PARSEC = 30856775814913673; // IAU standard parsec

export const SECONDS_PER_JULIAN_YEAR = 365.25 * 86400; // 31,557,600 s

export function distanceToMeters(value: number, unit: DistanceUnit): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Distance must be a finite positive number');
  }

  switch (unit) {
    case 'km':
      return value * METERS_PER_KM;
    case 'AU':
      return value * METERS_PER_AU;
    case 'ly':
      return value * METERS_PER_LIGHT_YEAR;
    case 'pc':
      return value * METERS_PER_PARSEC;
    default:
      throw new Error(`Unsupported distance unit: ${String(unit)}`);
  }
}

export function calculateLightTravelSeconds(distanceMeters: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    throw new Error('Distance in meters must be a finite positive number');
  }
  return distanceMeters / SPEED_OF_LIGHT_VACUUM_MPS;
}

export function formatLightTravelDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Unknown duration';
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)} minutes`;
  }

  const hours = seconds / 3600;
  if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  }

  const days = seconds / 86400;
  if (days < 365.25) {
    return `${Math.round(days)} days`;
  }

  const years = seconds / SECONDS_PER_JULIAN_YEAR;
  if (years < 100) {
    return `${years.toFixed(2)} years`;
  }

  if (years < 1000) {
    return `${years.toFixed(1)} years`;
  }

  if (years < 1_000_000) {
    return `${Math.round(years).toLocaleString()} years`;
  }

  const millions = years / 1_000_000;
  return `${millions.toFixed(1)} million years`;
}

export function distanceToLogScale(
  distanceMeters: number,
  minMeters: number,
  maxMeters: number,
): number {
  if (
    !Number.isFinite(distanceMeters) ||
    !Number.isFinite(minMeters) ||
    !Number.isFinite(maxMeters) ||
    distanceMeters <= 0 ||
    minMeters <= 0 ||
    maxMeters <= minMeters
  ) {
    return 0;
  }

  const logMin = Math.log10(minMeters);
  const logMax = Math.log10(maxMeters);
  const logVal = Math.log10(distanceMeters);

  const fraction = (logVal - logMin) / (logMax - logMin);
  return Math.max(0, Math.min(1, fraction));
}

export function formatDistanceKm(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return '0 km';
  }
  const km = distanceMeters / 1000;
  if (km < 1_000_000_000) {
    return `${Math.round(km).toLocaleString()} km`;
  }
  return `${km.toExponential(2)} km`;
}
