import {
  formatMeteorPeak,
  formatMeteorActiveWindow,
  computeMeteorStatus,
  isCalendarExpired,
  ZHR_EXPLANATION,
} from '../src/features/events/meteorFormatter';
import { MeteorCalendarManifest, MeteorEvent } from '../src/features/events/types';

describe('meteorFormatter', () => {
  const sampleEventHour: MeteorEvent = {
    id: 'geminids-2026',
    editionYear: 2026,
    name: 'Geminids',
    iauCode: 'GEM',
    activeStart: '2026-12-04',
    activeEnd: '2026-12-20',
    peakUTC: '2026-12-14T01:00:00Z',
    peakDate: '2026-12-14',
    precision: 'hour',
    radiant: { ra: 112, dec: 33, constellation: 'Gemini' },
    zhr: 150,
    velocityKmS: 35,
    parentBody: 'Asteroid (3200) Phaethon',
    skyViewerTargetId: 'star:Castor',
    observingGuidance: 'Richest annual shower',
    sources: [{ id: 'S10', name: 'IMO', url: 'https://imo.net' }],
  };

  const sampleEventDay: MeteorEvent = {
    id: 'orionids-2026',
    editionYear: 2026,
    name: 'Orionids',
    iauCode: 'ORI',
    activeStart: '2026-10-02',
    activeEnd: '2026-11-07',
    peakUTC: null,
    peakDate: '2026-10-21',
    precision: 'day',
    radiant: { ra: 95, dec: 16, constellation: 'Orion' },
    zhr: 20,
    velocityKmS: 66,
    parentBody: 'Comet 1P/Halley',
    skyViewerTargetId: 'star:Betelgeuse',
    observingGuidance: 'Broad maximum',
    sources: [{ id: 'S10', name: 'IMO', url: 'https://imo.net' }],
  };

  describe('formatMeteorPeak and timezone conversions', () => {
    it('converts exact UTC peak to Asia/Colombo (+05:30) half-hour offset', () => {
      // 2026-12-14T01:00:00Z + 05:30 = 2026-12-14 06:30
      const formatted = formatMeteorPeak(sampleEventHour, 'Asia/Colombo');
      expect(formatted).toContain('06:30');
      expect(formatted).toContain('Dec 14, 2026');
    });

    it('converts exact UTC peak to America/New_York (UTC-5 in December)', () => {
      // 2026-12-14T01:00:00Z - 5 hours = 2026-12-13 20:00
      const formatted = formatMeteorPeak(sampleEventHour, 'America/New_York');
      expect(formatted).toContain('20:00');
      expect(formatted).toContain('Dec 13, 2026');
    });

    it('retains date-only precision without inventing a fake hour when precision is day', () => {
      const formatted = formatMeteorPeak(sampleEventDay, 'Asia/Colombo');
      expect(formatted).toContain('Oct 21, 2026');
      expect(formatted).toContain('date precision only; source did not specify hour');
      // Must not contain any fabricated time of day
      expect(formatted).not.toContain(':00');
    });
  });

  describe('formatMeteorActiveWindow', () => {
    it('formats multi-day active date span cleanly', () => {
      const windowStr = formatMeteorActiveWindow(sampleEventHour, 'UTC');
      expect(windowStr).toContain('Dec 4');
      expect(windowStr).toContain('Dec 20, 2026');
    });
  });

  describe('computeMeteorStatus', () => {
    it('returns active_peak during the peak time window', () => {
      // 2 hours after peak
      const peakTime = new Date('2026-12-14T03:00:00Z');
      const { status } = computeMeteorStatus(sampleEventHour, peakTime);
      expect(status).toBe('active_peak');
    });

    it('returns active during active dates outside peak', () => {
      const activeTime = new Date('2026-12-08T12:00:00Z');
      const { status } = computeMeteorStatus(sampleEventHour, activeTime);
      expect(status).toBe('active');
    });

    it('returns upcoming before active dates', () => {
      const upcomingTime = new Date('2026-11-20T12:00:00Z');
      const { status } = computeMeteorStatus(sampleEventHour, upcomingTime);
      expect(status).toBe('upcoming');
    });

    it('returns past after active window ends', () => {
      const pastTime = new Date('2026-12-25T12:00:00Z');
      const { status } = computeMeteorStatus(sampleEventHour, pastTime);
      expect(status).toBe('past');
    });
  });

  describe('isCalendarExpired', () => {
    const manifest: MeteorCalendarManifest = {
      editionYear: 2026,
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
      reviewedAt: '2026-11-26',
      license: 'Public scientific facts',
      sources: [],
      events: [],
    };

    it('returns false during valid year', () => {
      expect(isCalendarExpired(manifest, new Date('2026-06-15T00:00:00Z'))).toBe(false);
    });

    it('returns true when current date is past validUntil', () => {
      expect(isCalendarExpired(manifest, new Date('2027-01-01T05:00:00Z'))).toBe(true);
    });
  });

  describe('ZHR_EXPLANATION', () => {
    it('clearly states ZHR is an idealized rate under dark skies and not a guaranteed count', () => {
      expect(ZHR_EXPLANATION).toContain('idealized theoretical rate');
      expect(ZHR_EXPLANATION).toContain('pristine dark skies');
      expect(ZHR_EXPLANATION).toContain('light pollution');
    });
  });
});
