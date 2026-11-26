/**
 * Pure Astronomical Scale & Travel Time Math Engine (F04)
 *
 * Implements pure calculations for:
 * - Relative diameter ratios with explicit reference bodies.
 * - Hypothetical straight-line travel times at constant velocities below c.
 * - Proportional schematic bar visualization scaling.
 *
 * All functions strictly validate inputs against physical limits (e.g. speed < c).
 */

import { SPEED_OF_LIGHT_VACUUM_MPS } from './lightMath';

/** Speed of light in kilometres per hour (exact BIPM derived) */
export const SPEED_OF_LIGHT_KMH = (SPEED_OF_LIGHT_VACUUM_MPS * 3_600) / 1_000; // 1,079,252,848.8 km/h

export interface TravelTimeResult {
  hours: number;
  days: number;
  years: number;
  formatted: string;
}

/**
 * Calculates the dimensionless diameter ratio of target body to reference body.
 * E.g., Sun (1,392,700 km) / Earth (12,742 km) = ~109.30
 */
export function calculateDiameterRatio(bodyDiameterKm: number, referenceDiameterKm: number): number {
  if (
    !Number.isFinite(bodyDiameterKm) ||
    !Number.isFinite(referenceDiameterKm) ||
    bodyDiameterKm <= 0 ||
    referenceDiameterKm <= 0
  ) {
    throw new Error('Diameters must be finite positive numbers');
  }

  return bodyDiameterKm / referenceDiameterKm;
}

/**
 * Calculates hypothetical constant-speed straight-line travel time (t = d / v).
 *
 * PHYSICAL ASSUMPTION & SCOPE:
 * This is a constant-speed Euclidean straight-line approximation.
 * It does not model orbital mechanics (e.g. Hohmann transfer ellipses),
 * gravitational assist maneuvers, acceleration/deceleration profiles, or
 * special relativistic time dilation.
 *
 * Speed must be strictly greater than 0 and strictly less than the speed of light c.
 */
export function calculateHypotheticalTravelTime(
  distanceKm: number,
  speedKmPerHour: number,
): TravelTimeResult {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new Error('Distance must be a finite positive number in kilometres');
  }

  if (!Number.isFinite(speedKmPerHour) || speedKmPerHour <= 0) {
    throw new Error('Speed must be a finite positive number in km/h');
  }

  if (speedKmPerHour >= SPEED_OF_LIGHT_KMH) {
    throw new Error('Hypothetical physical travel speed must be strictly below the speed of light c');
  }

  const hours = distanceKm / speedKmPerHour;
  const days = hours / 24;
  const years = days / 365.25;

  const formatted = formatScaleDuration(hours);

  return {
    hours,
    days,
    years,
    formatted,
  };
}

/**
 * Formats a duration in hours into a concise, human-readable string.
 */
export function formatScaleDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) {
    return '0 hours';
  }

  if (hours < 1) {
    const minutes = hours * 60;
    return `${minutes.toFixed(1)} minutes`;
  }

  if (hours < 48) {
    return `${hours.toFixed(1)} hours`;
  }

  const days = hours / 24;
  if (days < 365) {
    return `${days.toFixed(1)} days`;
  }

  const years = days / 365.25;
  if (years < 10) {
    return `${years.toFixed(2)} years`;
  }

  if (years < 100) {
    return `${years.toFixed(1)} years`;
  }

  if (years < 10_000) {
    return `${Math.round(years).toLocaleString()} years`;
  }

  const millions = years / 1_000_000;
  if (millions < 1) {
    return `${Math.round(years).toLocaleString()} years`;
  }

  return `${millions.toFixed(2)} million years`;
}

/**
 * Calculates a proportional bar percentage (from 2% to 100%) for visual schematic comparisons.
 * Uses a clamped logarithmic scale when values span orders of magnitude.
 */
export function calculateProportionalBarWidth(
  value: number,
  maxValue: number,
  minBarPercent = 3,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(maxValue) || value <= 0 || maxValue <= 0) {
    return minBarPercent;
  }

  const ratio = value / maxValue;
  const clamped = Math.max(0, Math.min(1, ratio));

  return Math.max(minBarPercent, Math.round(clamped * 100));
}

/**
 * Formats distance in kilometres with appropriate units.
 */
export function formatScaleKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) {
    return '0 km';
  }

  if (km < 10_000_000) {
    return `${Math.round(km).toLocaleString()} km`;
  }

  const millions = km / 1_000_000;
  if (millions < 1_000) {
    return `${millions.toFixed(1)} million km`;
  }

  const billions = km / 1_000_000_000;
  return `${billions.toFixed(2)} billion km`;
}
