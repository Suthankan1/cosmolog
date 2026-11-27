import { getLocalCalendarDate, formatTimelineItemSubtitle, groupTimelineByDate } from '../src/features/timeline/timelineGrouping';
import { TimelineItem } from '../src/features/timeline/types';

describe('timelineGrouping', () => {
  describe('getLocalCalendarDate & timezone boundaries', () => {
    it('correctly maps UTC timestamp across local midnight boundary in Asia/Colombo (+05:30)', () => {
      // 2026-11-26T20:00:00.000Z is 2026-11-27 01:30:00 in Asia/Colombo (+05:30)
      const utcIso = '2026-11-26T20:00:00.000Z';
      const colomboDate = getLocalCalendarDate(utcIso, 'Asia/Colombo');
      expect(colomboDate).toBe('2026-11-27');

      // But in America/New_York (UTC-5), it is 2026-11-26 15:00:00
      const nyDate = getLocalCalendarDate(utcIso, 'America/New_York');
      expect(nyDate).toBe('2026-11-26');
    });

    it('handles invalid dates safely without throwing', () => {
      expect(getLocalCalendarDate('not-a-date')).toBe('invalid');
    });
  });

  describe('formatTimelineItemSubtitle', () => {
    it('distinguishes observed event date from publication date', () => {
      const obsItem: TimelineItem = {
        id: 'observation:obs-1',
        sourceRecordId: 'obs-1',
        kind: 'observation',
        eventAt: '2026-11-20T14:30:00.000Z',
        dateKind: 'observed',
        title: 'Saturn Rings',
        summary: 'Crisp division',
        label: 'OBSERVATION',
        routeRef: { pathname: '/fieldwork/[id]', params: { id: 'obs-1' } },
        metadata: {
          conditions: 'Bortle 3',
          timezone: 'Asia/Colombo',
        },
      };

      const subtitle = formatTimelineItemSubtitle(obsItem, 'Asia/Colombo');
      expect(subtitle).toContain('Observed:');
      expect(subtitle).toContain('Bortle 3');
    });

    it('differentiates user saved action date from publisher release date', () => {
      const savedItem: TimelineItem = {
        id: 'discovery_saved:apod-1',
        sourceRecordId: 'apod-1',
        kind: 'discovery_saved',
        eventAt: '2026-11-25T10:00:00.000Z',
        dateKind: 'saved',
        title: 'Orion Nebula',
        summary: 'Star forming region',
        label: 'SAVED DISCOVERY',
        routeRef: { pathname: '/details/[source]/[id]', params: { source: 'nasa-apod', id: '1' } },
        metadata: {
          publishedAt: '2026-10-15T00:00:00.000Z',
        },
      };

      const subtitle = formatTimelineItemSubtitle(savedItem, 'UTC');
      expect(subtitle).toContain('Saved:');
      expect(subtitle).toContain('Published:');
      expect(subtitle).toContain('Nov 25, 2026');
      expect(subtitle).toContain('Oct 15, 2026');
    });

    it('labels undated items honestly as undated reference marks', () => {
      const studyItem: TimelineItem = {
        id: 'study_bookmark:kepler',
        sourceRecordId: 'kepler',
        kind: 'study_bookmark',
        eventAt: null,
        dateKind: 'undated',
        title: 'Kepler Laws',
        summary: 'Elliptical orbits',
        label: 'STUDY ENTRY',
        routeRef: { pathname: '/study/[id]', params: { id: 'kepler' } },
        metadata: {
          category: 'Orbital Mechanics',
        },
      };

      const subtitle = formatTimelineItemSubtitle(studyItem, 'UTC');
      expect(subtitle).toContain('Undated reference mark');
      expect(subtitle).toContain('Category: Orbital Mechanics');
    });
  });

  describe('groupTimelineByDate', () => {
    const fixedNowIso = '2026-11-27T12:00:00.000Z'; // Now is Nov 27, 2026

    it('groups items into Today, Yesterday, Month, and Undated', () => {
      const items: TimelineItem[] = [
        {
          id: 'observation:1',
          sourceRecordId: '1',
          kind: 'observation',
          eventAt: '2026-11-27T08:00:00.000Z', // Today
          dateKind: 'observed',
          title: 'Jupiter Moons',
          summary: null,
          label: 'OBSERVATION',
          routeRef: { pathname: '/fieldwork/[id]', params: { id: '1' } },
        },
        {
          id: 'discovery_saved:2',
          sourceRecordId: '2',
          kind: 'discovery_saved',
          eventAt: '2026-11-26T14:00:00.000Z', // Yesterday
          dateKind: 'saved',
          title: 'Andromeda Galaxy',
          summary: null,
          label: 'SAVED DISCOVERY',
          routeRef: { pathname: '/details/[source]/[id]', params: { source: 'nasa-apod', id: '2' } },
        },
        {
          id: 'reading_history:3',
          sourceRecordId: '3',
          kind: 'reading_history',
          eventAt: '2026-11-05T09:00:00.000Z', // Earlier in Nov 2026
          dateKind: 'read',
          title: 'James Webb Deep Field',
          summary: null,
          label: 'ARTICLE READ',
          routeRef: { pathname: '/details/[source]/[id]', params: { source: 'nasa-apod', id: '3' } },
        },
        {
          id: 'study_bookmark:4',
          sourceRecordId: '4',
          kind: 'study_bookmark',
          eventAt: null, // Undated
          dateKind: 'undated',
          title: 'Stellar Nucleosynthesis',
          summary: null,
          label: 'STUDY ENTRY',
          routeRef: { pathname: '/study/[id]', params: { id: '4' } },
        },
      ];

      const groups = groupTimelineByDate(items, 'UTC', fixedNowIso);
      expect(groups).toHaveLength(4);

      expect(groups[0].key).toBe('today');
      expect(groups[0].title).toBe('Today');
      expect(groups[0].items).toHaveLength(1);
      expect(groups[0].items[0].id).toBe('observation:1');

      expect(groups[1].key).toBe('yesterday');
      expect(groups[1].title).toBe('Yesterday');
      expect(groups[1].items).toHaveLength(1);
      expect(groups[1].items[0].id).toBe('discovery_saved:2');

      expect(groups[2].key).toBe('2026-11');
      expect(groups[2].title).toBe('November 2026');
      expect(groups[2].items).toHaveLength(1);
      expect(groups[2].items[0].id).toBe('reading_history:3');

      expect(groups[3].key).toBe('undated');
      expect(groups[3].title).toBe('Undated Reference Marks');
      expect(groups[3].items).toHaveLength(1);
      expect(groups[3].items[0].id).toBe('study_bookmark:4');
    });
  });
});
