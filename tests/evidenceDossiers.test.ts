import {
  validateEvidenceDossier,
  validateSourceRef,
  type EvidenceDossier,
} from '../src/features/study/evidence';
import {
  evidenceDossiers,
  rawEvidenceDossiers,
} from '../src/features/study/evidenceData';
import {
  listEvidenceDossiers,
  getEvidenceDossierById,
  getEvidenceDossiersForTarget,
} from '../src/features/study/evidenceRepository';

describe('Evidence Dossiers Data Model & Schema (F07)', () => {
  it('bundles at least three reviewed, peer-verified evidence dossiers', () => {
    expect(evidenceDossiers.length).toBeGreaterThanOrEqual(3);
    const ids = evidenceDossiers.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('verifies that each dossier contains all four required scientific blocks', () => {
    for (const dossier of evidenceDossiers) {
      expect(dossier.id).toMatch(/^dossier:[a-z0-9-]+$/);
      expect(dossier.revision).toBeGreaterThanOrEqual(1);
      expect(dossier.headline.trim()).not.toBe('');
      expect(dossier.targetName.trim()).not.toBe('');
      expect(dossier.category.trim()).not.toBe('');
      expect(dossier.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Four Ruled Blocks
      expect(dossier.observation.trim()).not.toBe('');
      expect(dossier.method.trim()).not.toBe('');
      expect(dossier.inference.trim()).not.toBe('');
      expect(dossier.uncertainty.trim()).not.toBe('');

      // Uncertainty Block must explicitly disclose negative boundary conditions
      const lower = dossier.uncertainty.toLowerCase();
      const hasNegativeBoundary =
        lower.includes('not ') ||
        lower.includes('cannot') ||
        lower.includes('does not') ||
        lower.includes('distinguish');
      expect(hasNegativeBoundary).toBe(true);
    }
  });

  it('validates WASP-39 b transmission spectroscopy dossier details', () => {
    const wasp = evidenceDossiers.find((d) => d.id === 'dossier:wasp-39b-co2');
    expect(wasp).toBeDefined();
    expect(wasp!.targetName).toBe('WASP-39 b');
    expect(wasp!.observation).toContain('4.3-micron absorption feature');
    expect(wasp!.method).toContain('NIRSpec');
    expect(wasp!.inference).toContain('carbon dioxide (CO2)');
    // Explicitly check that habitability / life claim is rejected
    expect(wasp!.uncertainty).toContain('NOT evidence of biological life');
    expect(wasp!.uncertainty).toContain('distinguished from illustrative artist renderings');
    expect(wasp!.asset).toBeDefined();
    expect(wasp!.asset!.isArtistConcept).toBe(false);
  });

  it('validates all primary sources use secure HTTPS origins and include publisher/date', () => {
    for (const dossier of evidenceDossiers) {
      expect(dossier.sourceRefs.length).toBeGreaterThan(0);
      for (const source of dossier.sourceRefs) {
        expect(source.url.startsWith('https://')).toBe(true);
        expect(source.publisher.trim()).not.toBe('');
        expect(source.title.trim()).not.toBe('');
        expect(source.accessedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('rejects dossiers with missing required blocks or invalid IDs', () => {
    const base: EvidenceDossier = {
      ...rawEvidenceDossiers[0],
    };

    expect(() => validateEvidenceDossier({ ...base, id: 'invalid-prefix' })).toThrow(
      'EvidenceDossier id must start with "dossier:"'
    );
    expect(() => validateEvidenceDossier({ ...base, revision: 0 })).toThrow(
      'EvidenceDossier revision must be a positive integer'
    );
    expect(() => validateEvidenceDossier({ ...base, observation: '' })).toThrow(
      'EvidenceDossier requires an empirical observation block'
    );
    expect(() => validateEvidenceDossier({ ...base, method: '   ' })).toThrow(
      'EvidenceDossier requires an instrumentation/method block'
    );
    expect(() => validateEvidenceDossier({ ...base, inference: '' })).toThrow(
      'EvidenceDossier requires a scientific inference block'
    );
    expect(() => validateEvidenceDossier({ ...base, uncertainty: '' })).toThrow(
      'EvidenceDossier requires an uncertainty block detailing what evidence does NOT establish'
    );
    expect(() =>
      validateEvidenceDossier({
        ...base,
        uncertainty: 'This finding is completely certain with zero caveats.',
      })
    ).toThrow('EvidenceDossier uncertainty must explicitly disclose what the data does NOT establish');
  });

  it('rejects insecure HTTP source references', () => {
    expect(() =>
      validateSourceRef({
        id: 'BAD',
        url: 'http://insecure.example.com',
        publisher: 'Test',
        title: 'Test',
        accessedAt: '2026-11-26',
      })
    ).toThrow('SourceRef requires a secure HTTPS url');
  });
});

describe('Evidence Dossiers Repository Layer', () => {
  it('lists all verified evidence dossiers', async () => {
    const list = await listEvidenceDossiers();
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.some((d) => d.id === 'dossier:wasp-39b-co2')).toBe(true);
    expect(list.some((d) => d.id === 'dossier:europa-plume-candidates')).toBe(true);
    expect(list.some((d) => d.id === 'dossier:sgr-a-stellar-orbits')).toBe(true);
  });

  it('retrieves an evidence dossier by stable ID', async () => {
    const item = await getEvidenceDossierById('dossier:europa-plume-candidates');
    expect(item).not.toBeNull();
    expect(item!.targetName).toBe('Europa');
    expect(item!.category).toBe('Ocean World Cryovolcanism');
    expect(item!.sourceRefs.length).toBeGreaterThanOrEqual(2);
  });

  it('returns null for nonexistent dossier IDs', async () => {
    const item = await getEvidenceDossierById('dossier:nonexistent-target');
    expect(item).toBeNull();
  });

  it('retrieves evidence dossiers matching target or related identifiers', async () => {
    const europaMatches = await getEvidenceDossiersForTarget('moon:europa');
    expect(europaMatches.length).toBe(1);
    expect(europaMatches[0].id).toBe('dossier:europa-plume-candidates');

    const sgrAMatches = await getEvidenceDossiersForTarget('black-hole:sgr-a');
    expect(sgrAMatches.length).toBe(1);
    expect(sgrAMatches[0].id).toBe('dossier:sgr-a-stellar-orbits');

    const deepSkyMatches = await getEvidenceDossiersForTarget('chapter:deep-sky');
    expect(deepSkyMatches.length).toBeGreaterThanOrEqual(2);
  });
});
