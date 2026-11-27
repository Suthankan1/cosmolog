/**
 * Meteor Calendar Data Contracts (F10)
 *
 * Sourced astronomical calendar models adhering to IMO & AMS definitions,
 * preserving source date precision and preventing fabricated visibility forecasts.
 */

export interface MeteorRadiant {
  /** Right ascension in degrees (0-360) or hours */
  ra: number;
  /** Declination in signed degrees (-90 to +90) */
  dec: number;
  /** Constellation containing the apparent radiant */
  constellation: string;
}

export interface MeteorSourceRef {
  id: string;
  name: string;
  url: string;
}

export type MeteorDatePrecision = 'hour' | 'day';

export interface MeteorEvent {
  id: string;
  editionYear: number;
  name: string;
  /** IAU Shower Working Group 3-letter code */
  iauCode: string;
  /** ISO date string YYYY-MM-DD */
  activeStart: string;
  /** ISO date string YYYY-MM-DD */
  activeEnd: string;
  /** ISO UTC timestamp, null if source only provides date-level precision */
  peakUTC: string | null;
  /** ISO date string YYYY-MM-DD */
  peakDate: string;
  /** Explicit source precision */
  precision: MeteorDatePrecision;
  radiant: MeteorRadiant | null;
  /** Idealized Zenithal Hourly Rate, null if undetermined */
  zhr: number | null;
  /** Atmospheric entry velocity in km/s */
  velocityKmS: number | null;
  /** Associated parent asteroid or comet */
  parentBody: string | null;
  /** Target ID for deep-linking into Sky Viewer */
  skyViewerTargetId: string | null;
  /** Concise factual observing advice */
  observingGuidance: string;
  sources: MeteorSourceRef[];
}

export interface MeteorCalendarManifest {
  editionYear: number;
  validFrom: string;
  validUntil: string;
  reviewedAt: string;
  license: string;
  sources: MeteorSourceRef[];
  events: MeteorEvent[];
}

export type MeteorEventStatus = 'active_peak' | 'active' | 'upcoming' | 'past';

export interface MeteorEventWithStatus extends MeteorEvent {
  status: MeteorEventStatus;
  statusLabel: string;
  /** Formatted peak display in selected timezone */
  formattedPeak: string;
  /** Formatted active window */
  formattedActiveWindow: string;
}
