import {
  expeditionManifestSchema,
  expeditions,
  getExpeditionById,
  getExpeditionDiscoveryDates,
  isValidCalendarDate,
  discoveryStepSchema,
  studyStepSchema,
  promptStepSchema,
} from '../src/features/expeditions/manifest';
import { readingPacks } from '../src/features/discovery/readingPacks';
import { computeExpeditionReadiness } from '../src/features/expeditions/expeditionDownloads';
import { sectionNumber, isValidStudyTarget } from '../src/features/study/edition';
import type { ReadingPackItem } from '../src/database/repositories/readingPacksRepository';

describe('Expedition Manifest Contracts & Validation', () => {
  it('validates bundled expeditions against the schema', () => {
    expect(expeditions.length).toBeGreaterThanOrEqual(2);
    for (const exp of expeditions) {
      const parsed = expeditionManifestSchema.parse(exp);
      expect(parsed.id).toBe(exp.id);
      expect(parsed.revision).toBeGreaterThan(0);
      expect(parsed.steps.length).toBeGreaterThanOrEqual(3);
      expect(parsed.sources.length).toBeGreaterThan(0);
    }
  });

  it('provides the reviewed guided Saturn expedition with discovery, study, and prompt steps', () => {
    const saturn = getExpeditionById('saturn');
    expect(saturn).toBeDefined();
    if (!saturn) return;

    expect(saturn.title).toBe('A Tour of Saturn');
    expect(saturn.sources.length).toBeGreaterThanOrEqual(2);

    const kinds = saturn.steps.map(s => s.kind);
    expect(kinds).toContain('discovery');
    expect(kinds).toContain('study');
    expect(kinds).toContain('prompt');

    const studyStep = saturn.steps.find(s => s.kind === 'study');
    expect(studyStep?.targetId).toBe('worlds');
    expect(studyStep?.sectionAnchor).toBe('rings');

    const promptStep = saturn.steps.find(s => s.kind === 'prompt');
    expect(promptStep?.promptInstruction).toBeDefined();
    expect(promptStep?.required).toBe(false);

    // Verify ordering is strictly ascending
    for (let i = 0; i < saturn.steps.length; i++) {
      expect(saturn.steps[i].order).toBe(i + 1);
    }
  });

  it('provides the reviewed guided Apollo expedition with verified steps', () => {
    const apollo = getExpeditionById('apollo');
    expect(apollo).toBeDefined();
    if (!apollo) return;

    expect(apollo.title).toBe('Apollo at the Moon');
    expect(apollo.sources.length).toBeGreaterThanOrEqual(2);

    const studyStep = apollo.steps.find(s => s.kind === 'study');
    expect(studyStep?.targetId).toBe('sun-earth-moon');
    expect(studyStep?.sectionAnchor).toBe('phases');

    const promptStep = apollo.steps.find(s => s.kind === 'prompt');
    expect(promptStep?.promptInstruction).toBeDefined();
    expect(promptStep?.required).toBe(false);
  });

  it('preserves backward compatibility with legacy reading pack discovery entries', () => {
    for (const pack of readingPacks) {
      const exp = getExpeditionById(pack.id);
      expect(exp).toBeDefined();
      if (!exp) continue;

      const dates = getExpeditionDiscoveryDates(exp);
      expect(dates.length).toBe(pack.entries.length);
      for (let i = 0; i < pack.entries.length; i++) {
        expect(dates[i].date).toBe(pack.entries[i].date);
      }
    }
  });

  it('validates calendar dates strictly with calendar leap rules and APOD bounds', () => {
    // Valid dates
    expect(isValidCalendarDate('1995-06-16')).toBe(true); // First APOD
    expect(isValidCalendarDate('2024-02-29')).toBe(true); // Leap year 2024
    expect(isValidCalendarDate('2000-02-29')).toBe(true); // Century leap year 2000
    expect(isValidCalendarDate('2023-12-31')).toBe(true);

    // Invalid dates
    expect(isValidCalendarDate('1994-12-31')).toBe(false); // Before 1995
    expect(isValidCalendarDate('1995-06-15')).toBe(false); // Before APOD start
    expect(isValidCalendarDate('2023-02-29')).toBe(false); // 2023 is not a leap year
    expect(isValidCalendarDate('2100-02-29')).toBe(false); // 2100 is not a leap year
    expect(isValidCalendarDate('2024-04-31')).toBe(false); // April has 30 days
    expect(isValidCalendarDate('2024-06-31')).toBe(false); // June has 30 days
    expect(isValidCalendarDate('2024-13-01')).toBe(false); // Month 13
    expect(isValidCalendarDate('2024-00-15')).toBe(false); // Month 0
    expect(isValidCalendarDate('2024-01-32')).toBe(false); // Day 32
    expect(isValidCalendarDate('invalid-date')).toBe(false);
  });

  it('enforces canonical discovery targetId matching nasa-apod:YYYY-MM-DD', () => {
    const valid = {
      id: 'step-valid',
      kind: 'discovery' as const,
      order: 1,
      title: 'Valid plate',
      summary: 'Summary',
      targetId: 'nasa-apod:2017-08-08',
      date: '2017-08-08',
      required: true,
    };
    expect(discoveryStepSchema.parse(valid)).toEqual(valid);

    const mismatchedTarget = {
      ...valid,
      targetId: 'nasa-apod:2017-08-09',
    };
    expect(() => discoveryStepSchema.parse(mismatchedTarget)).toThrow(/Discovery targetId must match/);

    const invalidDate = {
      ...valid,
      date: '2023-02-29',
      targetId: 'nasa-apod:2023-02-29',
    };
    expect(() => discoveryStepSchema.parse(invalidDate)).toThrow(/Date must be a valid calendar date/);
  });

  it('validates study target chapter and section anchor existence', () => {
    // Valid target and anchor
    expect(isValidStudyTarget('worlds', 'rings')).toBe(true);
    expect(isValidStudyTarget('sun-earth-moon', 'phases')).toBe(true);
    // Heading title is also validly resolved
    expect(isValidStudyTarget('worlds', 'Saturn and its rings')).toBe(true);

    const validStudy = {
      id: 'step-study-valid',
      kind: 'study' as const,
      order: 1,
      title: 'Study worlds',
      summary: 'Summary',
      targetId: 'worlds',
      sectionAnchor: 'rings',
      required: true,
    };
    expect(studyStepSchema.parse(validStudy)).toEqual(validStudy);

    // Invalid chapter
    const invalidChapter = {
      ...validStudy,
      targetId: 'nonexistent-chapter',
    };
    expect(() => studyStepSchema.parse(invalidChapter)).toThrow(/Study targetId must reference/);

    // Invalid anchor for known chapter
    const invalidAnchor = {
      ...validStudy,
      sectionAnchor: 'nonexistent-anchor',
    };
    expect(() => studyStepSchema.parse(invalidAnchor)).toThrow(/Study sectionAnchor must match/);
  });

  it('resolves section number accurately for slugs and titles', () => {
    expect(sectionNumber('worlds', 'rings')).toBe(1);
    expect(sectionNumber('worlds', 'Saturn and its rings')).toBe(1);
    expect(sectionNumber('chapter:worlds', 'rings')).toBe(1);
    expect(sectionNumber('chapter:sun-earth-moon', 'phases')).toBe(1);
    expect(sectionNumber('chapter:sun-earth-moon', 'Phases and tides')).toBe(1);
    expect(sectionNumber('worlds', 'ocean-worlds')).toBe(2);
    expect(sectionNumber('worlds', 'nonexistent', 0)).toBe(0);
  });

  it('validates prompt steps and rejects missing instruction', () => {
    const validPrompt = {
      id: 'step-prompt-valid',
      kind: 'prompt' as const,
      order: 1,
      title: 'Observe sky',
      summary: 'Summary',
      promptInstruction: 'Look up at Saturn using binoculars.',
      required: false,
    };
    expect(promptStepSchema.parse(validPrompt)).toEqual(validPrompt);

    const missingInstruction = {
      id: 'step-prompt-invalid',
      kind: 'prompt' as const,
      order: 1,
      title: 'Observe sky',
      summary: 'Summary',
      required: false,
    };
    expect(() => promptStepSchema.parse(missingInstruction)).toThrow();
  });

  it('rejects duplicate step IDs within an expedition', () => {
    const invalid = {
      id: 'test-exp',
      revision: 1,
      title: 'Invalid expedition',
      description: 'Contains duplicate step IDs',
      estimatedBytes: 1000,
      sources: [{ title: 'Source', publisher: 'Pub', url: 'https://example.com' }],
      steps: [
        { id: 'dup-step', kind: 'discovery' as const, order: 1, title: 'Step 1', summary: 'Summary 1', targetId: 'nasa-apod:2017-08-08', date: '2017-08-08', required: true },
        { id: 'dup-step', kind: 'study' as const, order: 2, title: 'Step 2', summary: 'Summary 2', targetId: 'worlds', sectionAnchor: 'rings', required: true },
      ],
    };

    expect(() => expeditionManifestSchema.parse(invalid)).toThrow(/Step IDs must be unique/);
  });

  it('rejects duplicate step order values', () => {
    const invalid = {
      id: 'test-exp',
      revision: 1,
      title: 'Invalid order',
      description: 'Contains duplicate orders',
      estimatedBytes: 1000,
      sources: [{ title: 'Source', publisher: 'Pub', url: 'https://example.com' }],
      steps: [
        { id: 'step-1', kind: 'discovery' as const, order: 1, title: 'Step 1', summary: 'Summary 1', targetId: 'nasa-apod:2017-08-08', date: '2017-08-08', required: true },
        { id: 'step-2', kind: 'study' as const, order: 1, title: 'Step 2', summary: 'Summary 2', targetId: 'worlds', sectionAnchor: 'rings', required: true },
      ],
    };

    expect(() => expeditionManifestSchema.parse(invalid)).toThrow(/order numbers must be unique/);
  });

  it('rejects duplicate discovery target IDs within an expedition', () => {
    const invalid = {
      id: 'test-exp',
      revision: 1,
      title: 'Duplicate targets',
      description: 'Contains duplicate APOD dates',
      estimatedBytes: 1000,
      sources: [{ title: 'Source', publisher: 'Pub', url: 'https://example.com' }],
      steps: [
        { id: 'step-1', kind: 'discovery' as const, order: 1, title: 'Step 1', summary: 'Summary 1', targetId: 'nasa-apod:2017-08-08', date: '2017-08-08', required: true },
        { id: 'step-2', kind: 'discovery' as const, order: 2, title: 'Step 2', summary: 'Summary 2', targetId: 'nasa-apod:2017-08-08', date: '2017-08-08', required: true },
      ],
    };

    expect(() => expeditionManifestSchema.parse(invalid)).toThrow(/Discovery target IDs must be unique/);
  });

  it('rejects non-positive revisions, negative bytes, or bounded byte overflow', () => {
    const negativeBytes = {
      id: 'valid-id',
      revision: 1,
      title: 'Title',
      description: 'Desc',
      estimatedBytes: -5,
      sources: [{ title: 'Source', publisher: 'Pub', url: 'https://example.com' }],
      steps: [],
    };
    expect(() => expeditionManifestSchema.parse(negativeBytes)).toThrow();

    const excessiveBytes = {
      id: 'valid-id',
      revision: 1,
      title: 'Title',
      description: 'Desc',
      estimatedBytes: 600_000_000, // Exceeds 500MB boundary
      sources: [{ title: 'Source', publisher: 'Pub', url: 'https://example.com' }],
      steps: [],
    };
    expect(() => expeditionManifestSchema.parse(excessiveBytes)).toThrow();
  });

  it('rejects invalid or unsafe URLs in sources', () => {
    const invalidUrl = {
      id: 'valid-id',
      revision: 1,
      title: 'Title',
      description: 'Desc',
      estimatedBytes: 1000,
      sources: [{ title: 'Source', publisher: 'Pub', url: 'javascript:alert(1)' }],
      steps: [
        { id: 'step-1', kind: 'discovery' as const, order: 1, title: 'Step 1', summary: 'Summary 1', targetId: 'nasa-apod:2017-08-08', date: '2017-08-08', required: true },
      ],
    };
    expect(() => expeditionManifestSchema.parse(invalidUrl)).toThrow();
  });

  it('computes readiness honestly without allowing extra or unrelated rows to inflate counts', () => {
    const saturn = getExpeditionById('saturn')!;

    // Case 1: Unrelated items or old pack rows must not inflate readiness
    const unrelatedItems: ReadingPackItem[] = [
      {
        localId: 'nasa-apod:2000-01-01',
        source: 'nasa-apod',
        externalId: '2000-01-01', // not a saturn step
        title: 'Unrelated plate 1',
        summary: 'S',
        body: 'B',
        publishedAt: '2000-01-01',
        imageRemoteUrl: null,
        imageLocalUri: null,
        canonicalUrl: 'https://example.com',
        attribution: 'NASA',
        author: null,
        mediaType: 'image',
        fetchedAt: '2000-01-01',
        updatedAt: '2000-01-01',
        packId: 'saturn',
        mediaStatus: 'ready',
        imageBytes: 1000,
      },
      {
        localId: 'nasa-apod:2000-01-02',
        source: 'nasa-apod',
        externalId: '2000-01-02', // not a saturn step
        title: 'Unrelated plate 2',
        summary: 'S',
        body: 'B',
        publishedAt: '2000-01-02',
        imageRemoteUrl: null,
        imageLocalUri: null,
        canonicalUrl: 'https://example.com',
        attribution: 'NASA',
        author: null,
        mediaType: 'image',
        fetchedAt: '2000-01-02',
        updatedAt: '2000-01-02',
        packId: 'saturn',
        mediaStatus: 'ready',
        imageBytes: 1000,
      },
    ];

    const readiness1 = computeExpeditionReadiness(saturn, unrelatedItems);
    expect(readiness1.savedDiscoveryCount).toBe(0);
    expect(readiness1.isTextReady).toBe(false);
    expect(readiness1.isFullyReady).toBe(false);
    expect(readiness1.hasWork).toBe(true);

    // Case 2: One required step installed, image pending
    const partialItem: ReadingPackItem = {
      localId: 'nasa-apod:2013-11-13',
      source: 'nasa-apod',
      externalId: '2013-11-13', // Saturn step 1
      title: 'In the Shadow of Saturn',
      summary: 'S',
      body: 'B',
      publishedAt: '2013-11-13',
      imageRemoteUrl: 'https://example.com/saturn.jpg',
      imageLocalUri: null,
      canonicalUrl: 'https://example.com',
      attribution: 'NASA',
      author: null,
      mediaType: 'image',
      fetchedAt: '2013-11-13',
      updatedAt: '2013-11-13',
      packId: 'saturn',
      mediaStatus: 'waiting',
      imageBytes: 0,
    };

    const readiness2 = computeExpeditionReadiness(saturn, [partialItem]);
    expect(readiness2.savedDiscoveryCount).toBe(1);
    expect(readiness2.requiredDiscoveryCount).toBe(3);
    expect(readiness2.isTextReady).toBe(false);
    expect(readiness2.isMediaReady).toBe(false);
    expect(readiness2.isStudyReady).toBe(true); // worlds is built-in
    expect(readiness2.hasWork).toBe(true);
  });
});
