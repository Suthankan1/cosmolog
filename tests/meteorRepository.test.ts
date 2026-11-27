import {
  getMeteorCalendarManifest,
  getMeteorEvents,
  getMeteorEventById,
  isManifestExpired,
} from '../src/features/events/meteorRepository';

describe('meteorRepository', () => {
  it('loads valid bundled 2026 manifest adhering to scientific contracts', () => {
    const manifest = getMeteorCalendarManifest();
    expect(manifest.editionYear).toBe(2026);
    expect(manifest.validFrom).toBe('2026-01-01');
    expect(manifest.validUntil).toBe('2026-12-31');
    expect(manifest.events.length).toBeGreaterThanOrEqual(7);

    // Verify all IDs are unique
    const ids = manifest.events.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Verify all events have IAU codes and sources
    for (const event of manifest.events) {
      expect(event.iauCode).toMatch(/^[A-Z]{3}$/);
      expect(event.sources.length).toBeGreaterThanOrEqual(1);
      expect(event.activeStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(event.activeEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(event.peakDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      if (event.precision === 'hour') {
        expect(event.peakUTC).not.toBeNull();
      } else {
        expect(event.peakUTC).toBeNull();
      }
    }
  });

  it('sorts meteor events chronologically by peak date', () => {
    const events = getMeteorEvents();
    for (let i = 0; i < events.length - 1; i++) {
      expect(events[i].peakDate <= events[i + 1].peakDate).toBe(true);
    }
  });

  it('filters events by status', () => {
    // Fixed test date in November 2026
    const testNow = new Date('2026-11-15T12:00:00Z');

    const allEvents = getMeteorEvents({ now: testNow });
    const upcomingEvents = getMeteorEvents({ now: testNow, statusFilter: 'upcoming' });
    const pastEvents = getMeteorEvents({ now: testNow, statusFilter: 'past' });

    expect(allEvents.length).toBeGreaterThan(0);
    expect(upcomingEvents.every(e => e.status === 'upcoming')).toBe(true);
    expect(pastEvents.every(e => e.status === 'past')).toBe(true);
  });

  it('retrieves an event by ID or returns null for unknown ID', () => {
    const geminids = getMeteorEventById('geminids-2026');
    expect(geminids).not.toBeNull();
    expect(geminids?.name).toBe('Geminids');
    expect(geminids?.iauCode).toBe('GEM');
    expect(geminids?.zhr).toBe(150);

    const unknown = getMeteorEventById('nonexistent-shower');
    expect(unknown).toBeNull();
  });

  it('correctly reports expiration status', () => {
    expect(isManifestExpired(new Date('2026-08-01T00:00:00Z'))).toBe(false);
    expect(isManifestExpired(new Date('2027-02-01T00:00:00Z'))).toBe(true);
  });
});
