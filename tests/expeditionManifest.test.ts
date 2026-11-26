import {
  expeditionManifestSchema,
  expeditions,
  getExpeditionById,
  getExpeditionDiscoveryDates,
} from '../src/features/expeditions/manifest';
import { readingPacks } from '../src/features/discovery/readingPacks';

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
    expect(studyStep?.sectionAnchor).toBe('Saturn and its rings');

    const promptStep = saturn.steps.find(s => s.kind === 'prompt');
    expect(promptStep?.promptInstruction).toBeDefined();
    expect(promptStep?.required).toBe(false);

    // Verify ordering is strictly ascending
    for (let i = 0; i < saturn.steps.length; i++) {
      expect(saturn.steps[i].order).toBe(i + 1);
    }
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

  it('rejects duplicate step IDs within an expedition', () => {
    const invalid = {
      id: 'test-exp',
      revision: 1,
      title: 'Invalid expedition',
      description: 'Contains duplicate step IDs',
      estimatedBytes: 1000,
      sources: [{ title: 'Source', publisher: 'Pub', url: 'https://example.com' }],
      steps: [
        { id: 'dup-step', kind: 'discovery' as const, order: 1, title: 'Step 1', summary: 'Summary 1', required: true },
        { id: 'dup-step', kind: 'study' as const, order: 2, title: 'Step 2', summary: 'Summary 2', required: true },
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
        { id: 'step-1', kind: 'discovery' as const, order: 1, title: 'Step 1', summary: 'Summary 1', required: true },
        { id: 'step-2', kind: 'study' as const, order: 1, title: 'Step 2', summary: 'Summary 2', required: true },
      ],
    };

    expect(() => expeditionManifestSchema.parse(invalid)).toThrow(/order numbers must be unique/);
  });

  it('rejects non-positive revisions, negative bytes, or empty steps', () => {
    const base = {
      id: 'valid-id',
      revision: 0,
      title: 'Title',
      description: 'Desc',
      estimatedBytes: -5,
      sources: [{ title: 'Source', publisher: 'Pub', url: 'https://example.com' }],
      steps: [],
    };
    expect(() => expeditionManifestSchema.parse(base)).toThrow();
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
        { id: 'step-1', kind: 'discovery' as const, order: 1, title: 'Step 1', summary: 'Summary 1', required: true },
      ],
    };
    expect(() => expeditionManifestSchema.parse(invalidUrl)).toThrow();
  });
});
