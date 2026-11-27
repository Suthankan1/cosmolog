/**
 * Meteor Calendar Repository (F10)
 *
 * Provides offline access to verified annual meteor shower datasets.
 * Validates manifest schema and dates, sorts chronologically, and applies filters.
 */

import manifestData from './data/meteors-2026.json';
import { enrichMeteorEvent, isCalendarExpired } from './meteorFormatter';
import {
  MeteorCalendarManifest,
  MeteorEventWithStatus,
} from './types';

export function getMeteorCalendarManifest(): MeteorCalendarManifest {
  return manifestData as MeteorCalendarManifest;
}

export function isManifestExpired(now?: Date): boolean {
  return isCalendarExpired(getMeteorCalendarManifest(), now);
}

export function getMeteorEvents(options?: {
  timezone?: string;
  now?: Date;
  statusFilter?: 'all' | 'active' | 'upcoming' | 'past';
}): MeteorEventWithStatus[] {
  const manifest = getMeteorCalendarManifest();
  const timezone = options?.timezone;
  const now = options?.now;
  const statusFilter = options?.statusFilter ?? 'all';

  const enriched = manifest.events.map(event => enrichMeteorEvent(event, timezone, now));

  // Sort chronologically by peakDate
  enriched.sort((a, b) => a.peakDate.localeCompare(b.peakDate));

  if (statusFilter === 'all') {
    return enriched;
  }

  if (statusFilter === 'active') {
    return enriched.filter(e => e.status === 'active' || e.status === 'active_peak');
  }

  return enriched.filter(e => e.status === statusFilter);
}

export function getMeteorEventById(
  id: string,
  timezone?: string,
  now?: Date
): MeteorEventWithStatus | null {
  const manifest = getMeteorCalendarManifest();
  const event = manifest.events.find(e => e.id === id);
  if (!event) return null;
  return enrichMeteorEvent(event, timezone, now);
}
