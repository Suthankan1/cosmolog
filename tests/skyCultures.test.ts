import {
  validateCultureOverlay,
  type CultureOverlay,
} from '../src/features/sky/catalog/cultures/types';
import {
  cultureOverlays,
  listCultureOverlays,
  getCultureOverlayById,
  validateAllCultures,
} from '../src/features/sky/catalog/cultures/cultureRepository';
import manifestData from '../src/features/sky/catalog/cultures/manifest.json';
import brightStars from '../src/features/sky/catalog/bright-stars.json';

const catalogHips = new Set<number>(brightStars.map((s) => s.hip));

describe('Cultural Sky Overlay Datasets (F08)', () => {
  it('bundles exactly two verified, peer-reviewed cultural traditions for the equatorial sky region', () => {
    expect(cultureOverlays.length).toBe(2);
    expect(manifestData.cultures.length).toBe(2);

    const ids = cultureOverlays.map((c) => c.id);
    expect(ids).toContain('culture:arabic-bedouin');
    expect(ids).toContain('culture:chinese-traditional');
  });

  it('validates that every star in both cultures exists in bright-stars.json with valid J2000 coordinates', () => {
    for (const culture of cultureOverlays) {
      expect(culture.epoch).toBe('J2000.0');
      for (const asterism of culture.asterisms) {
        expect(asterism.stars.length).toBeGreaterThanOrEqual(7);
        for (const star of asterism.stars) {
          expect(catalogHips.has(star.hip)).toBe(true);

          const catalogEntry = brightStars.find((s) => s.hip === star.hip);
          expect(catalogEntry).toBeDefined();
          expect(catalogEntry!.ra).toBeGreaterThanOrEqual(0);
          expect(catalogEntry!.ra).toBeLessThanOrEqual(24);
          expect(catalogEntry!.dec).toBeGreaterThanOrEqual(-90);
          expect(catalogEntry!.dec).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it('verifies that all line segments connect existing stars and do not loop onto themselves', () => {
    for (const culture of cultureOverlays) {
      for (const asterism of culture.asterisms) {
        const astHips = new Set(asterism.stars.map((s) => s.hip));
        expect(asterism.segments.length).toBeGreaterThanOrEqual(6);

        const seenSegments = new Set<string>();
        for (const seg of asterism.segments) {
          expect(seg.fromHip).not.toBe(seg.toHip);
          expect(astHips.has(seg.fromHip)).toBe(true);
          expect(astHips.has(seg.toHip)).toBe(true);

          // Canonical sorted key to detect redundant identical segments
          const key = [Math.min(seg.fromHip, seg.toHip), Math.max(seg.fromHip, seg.toHip)].join('-');
          expect(seenSegments.has(key)).toBe(false);
          seenSegments.add(key);
        }
      }
    }
  });

  it('verifies authentic historical context and explicit distinction from modern IAU Orion', () => {
    const arabic = cultureOverlays.find((c) => c.id === 'culture:arabic-bedouin')!;
    expect(arabic.tradition).toContain('Arabic');
    expect(arabic.asterisms[0].name).toBe("Al-Jawza'");
    expect(arabic.asterisms[0].nativeScript).toBe('الجوزاء');
    expect(arabic.historicalContext).toContain('al-Sufi');
    expect(arabic.historicalContext).toContain('anwa');
    // Must explicitly disclose that Al-Jawza' is NOT simply Greek Orion
    expect(arabic.contrastWithIAU).toContain('NOT an Arabic translation of the Greek Orion');

    const chinese = cultureOverlays.find((c) => c.id === 'culture:chinese-traditional')!;
    expect(chinese.tradition).toContain('Chinese');
    expect(chinese.asterisms[0].name).toBe('Shen');
    expect(chinese.asterisms[0].nativeScript).toBe('参宿');
    expect(chinese.historicalContext).toContain('Western White Tiger');
    expect(chinese.historicalContext).toContain('Sima Qian');
    // Must explicitly disclose that Shen is NOT simply Greek Orion
    expect(chinese.contrastWithIAU).toContain('completely distinct from the Western hunter Orion');
  });

  it('validates licensed provenance and secure HTTPS source references', () => {
    for (const culture of cultureOverlays) {
      expect(culture.sourceRefs.length).toBeGreaterThanOrEqual(2);
      for (const source of culture.sourceRefs) {
        expect(source.url.startsWith('https://')).toBe(true);
        expect(source.publisher.trim()).not.toBe('');
        expect(source.title.trim()).not.toBe('');
      }

      expect(culture.licenses.textLicense).toContain('CC BY-SA');
      expect(culture.licenses.attribution.trim()).not.toBe('');
    }
  });

  it('rejects invalid overlay schemas and missing catalog endpoints', () => {
    const valid: CultureOverlay = {
      ...cultureOverlays[0],
    };

    expect(() => validateCultureOverlay({ ...valid, id: 'bad-id' })).toThrow(
      'CultureOverlay id must start with "culture:"'
    );
    expect(() => validateCultureOverlay({ ...valid, revision: -1 })).toThrow(
      'CultureOverlay revision must be a positive integer'
    );
    expect(() => validateCultureOverlay({ ...valid, tradition: '' })).toThrow(
      'CultureOverlay requires a non-empty tradition name'
    );
    expect(() => validateCultureOverlay({ ...valid, contrastWithIAU: ' ' })).toThrow(
      'CultureOverlay requires contrastWithIAU explicitly disclaiming modern 1-to-1 IAU equivalence'
    );

    // Segment endpoint not in stars
    const brokenSegment = {
      ...valid,
      asterisms: [
        {
          ...valid.asterisms[0],
          segments: [{ fromHip: 27989, toHip: 999999 }],
        },
      ],
    };
    expect(() => validateCultureOverlay(brokenSegment)).toThrow(
      'Segment endpoint toHip 999999 not in asterism al-jawza stars'
    );

    // Self-looping segment
    const selfLoop = {
      ...valid,
      asterisms: [
        {
          ...valid.asterisms[0],
          segments: [{ fromHip: 27989, toHip: 27989 }],
        },
      ],
    };
    expect(() => validateCultureOverlay(selfLoop)).toThrow(
      'Segment in asterism al-jawza cannot connect star 27989 to itself'
    );

    // Star missing from catalog
    const missingStar = {
      ...valid,
      asterisms: [
        {
          ...valid.asterisms[0],
          stars: [{ hip: 999999, nativeName: 'Ghost' }],
          segments: [{ fromHip: 999999, toHip: 999999 }],
        },
      ],
    };
    expect(() => validateCultureOverlay(missingStar, catalogHips)).toThrow(
      'Star HIP 999999 in asterism al-jawza is missing from bright star catalog'
    );
  });
});

describe('Cultural Sky Overlay Repository', () => {
  it('lists all culture overlays', async () => {
    const list = await listCultureOverlays();
    expect(list.length).toBe(2);
  });

  it('retrieves culture overlay by id', async () => {
    const arabic = await getCultureOverlayById('culture:arabic-bedouin');
    expect(arabic).not.toBeNull();
    expect(arabic!.asterisms[0].name).toBe("Al-Jawza'");

    const chinese = await getCultureOverlayById('culture:chinese-traditional');
    expect(chinese).not.toBeNull();
    expect(chinese!.asterisms[0].name).toBe('Shen');

    const unknown = await getCultureOverlayById('culture:unknown');
    expect(unknown).toBeNull();
  });

  it('runs validateAllCultures successfully', () => {
    expect(validateAllCultures()).toBe(true);
  });
});
