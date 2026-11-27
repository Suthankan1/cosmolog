/**
 * Meteor Calendar Timezone Formatter and Status Derived Engine (F10)
 *
 * Implements pure date & timezone conversions respecting source date precision:
 * - Exact UTC timestamps converted to selected IANA timezone (including half-hour offsets like Asia/Colombo).
 * - Date-only records stay date-only without fabricated hours.
 * - Handles dataset expiry and ZHR idealized rate caveats honestly.
 */

import {
  MeteorCalendarManifest,
  MeteorEvent,
  MeteorEventStatus,
  MeteorEventWithStatus,
} from './types';

export const ZHR_EXPLANATION =
  'Zenithal Hourly Rate (ZHR) is an idealized theoretical rate under pristine dark skies with radiant overhead. Real observed counts depend heavily on local light pollution, horizon altitude, moon phase, and cloud cover.';

export function isCalendarExpired(manifest: MeteorCalendarManifest, now?: Date): boolean {
  const current = now ?? new Date();
  const validUntilDate = new Date(`${manifest.validUntil}T23:59:59Z`);
  return current.getTime() > validUntilDate.getTime();
}

export function formatMeteorPeak(
  event: MeteorEvent,
  timezone?: string
): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // If source only provides date precision, do NOT fabricate an hour
  if (event.precision === 'day' || !event.peakUTC) {
    try {
      const [year, month, day] = event.peakDate.split('-').map(Number);
      const sampleUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const formattedDate = new Intl.DateTimeFormat(undefined, {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(sampleUtc);
      return `${formattedDate} (date precision only; source did not specify hour)`;
    } catch {
      return event.peakDate;
    }
  }

  // Exact UTC timestamp converted to target IANA timezone
  try {
    const utcDate = new Date(event.peakUTC);
    if (isNaN(utcDate.getTime())) return event.peakDate;

    const formatter = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
    return formatter.format(utcDate);
  } catch {
    return event.peakUTC;
  }
}

export function formatMeteorActiveWindow(
  event: MeteorEvent,
  timezone?: string
): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  try {
    const [startYear, startMonth, startDay] = event.activeStart.split('-').map(Number);
    const [endYear, endMonth, endDay] = event.activeEnd.split('-').map(Number);

    const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

    const startFmt = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
    }).format(startDate);

    const endFmt = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(endDate);

    return `${startFmt} – ${endFmt}`;
  } catch {
    return `${event.activeStart} to ${event.activeEnd}`;
  }
}

export function computeMeteorStatus(
  event: MeteorEvent,
  now?: Date
): { status: MeteorEventStatus; statusLabel: string } {
  const current = now ?? new Date();
  const currentIsoDate = current.toISOString().slice(0, 10);

  // Peak window: if peakUTC is known, within +/- 18 hours of peakUTC; else if peakDate matches today
  if (event.peakUTC) {
    const peakTime = new Date(event.peakUTC).getTime();
    const diffHours = Math.abs(current.getTime() - peakTime) / (1000 * 60 * 60);
    if (diffHours <= 18) {
      return { status: 'active_peak', statusLabel: 'PEAK ACTIVE NOW' };
    }
  } else if (currentIsoDate === event.peakDate) {
    return { status: 'active_peak', statusLabel: 'PEAK DATE TODAY' };
  }

  // Active check
  if (currentIsoDate >= event.activeStart && currentIsoDate <= event.activeEnd) {
    return { status: 'active', statusLabel: 'ACTIVE SHOWER' };
  }

  // Upcoming vs Past
  if (currentIsoDate < event.activeStart) {
    return { status: 'upcoming', statusLabel: 'UPCOMING' };
  }

  return { status: 'past', statusLabel: 'PAST' };
}

export function enrichMeteorEvent(
  event: MeteorEvent,
  timezone?: string,
  now?: Date
): MeteorEventWithStatus {
  const { status, statusLabel } = computeMeteorStatus(event, now);
  const formattedPeak = formatMeteorPeak(event, timezone);
  const formattedActiveWindow = formatMeteorActiveWindow(event, timezone);

  return {
    ...event,
    status,
    statusLabel,
    formattedPeak,
    formattedActiveWindow,
  };
}
