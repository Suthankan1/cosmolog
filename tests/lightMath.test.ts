import {
  SPEED_OF_LIGHT_VACUUM_MPS,
  METERS_PER_KM,
  METERS_PER_AU,
  METERS_PER_LIGHT_YEAR,
  METERS_PER_PARSEC,
  distanceToMeters,
  calculateLightTravelSeconds,
  formatLightTravelDuration,
  distanceToLogScale,
  formatDistanceKm,
} from '../src/features/labs/lightMath';
import {
  getLightTargetById,
  getAllLightTargets,
} from '../src/features/labs/data/lighttrace';
import { studyEntries } from '../src/features/study/edition';

describe('LightTrace Pure Astronomical Math (F03)', () => {
  it('conforms to authoritative physical constants and SI base definitions (S01, S02)', () => {
    // Exact BIPM definition of the metre
    expect(SPEED_OF_LIGHT_VACUUM_MPS).toBe(299_792_458);
    // Exact IAU definitions
    expect(METERS_PER_KM).toBe(1_000);
    expect(METERS_PER_AU).toBe(149_597_870_700);
    expect(METERS_PER_LIGHT_YEAR).toBe(9_460_730_472_580_800);
    expect(METERS_PER_PARSEC).toBe(30_856_775_814_913_673);
  });

  it('converts astronomical distance units to meters accurately', () => {
    expect(distanceToMeters(1, 'km')).toBe(1000);
    expect(distanceToMeters(384400, 'km')).toBe(384_400_000);
    expect(distanceToMeters(1, 'AU')).toBe(149_597_870_700);
    expect(distanceToMeters(2, 'ly')).toBe(2 * 9_460_730_472_580_800);
    expect(distanceToMeters(1, 'pc')).toBe(30_856_775_814_913_673);
  });

  it('rejects invalid, negative, zero, and non-finite distances', () => {
    expect(() => distanceToMeters(0, 'km')).toThrow(/finite positive/);
    expect(() => distanceToMeters(-100, 'km')).toThrow(/finite positive/);
    expect(() => distanceToMeters(NaN, 'km')).toThrow(/finite positive/);
    expect(() => distanceToMeters(Infinity, 'km')).toThrow(/finite positive/);
    expect(() => distanceToMeters(100, 'invalid' as never)).toThrow(/Unsupported distance unit/);

    expect(() => calculateLightTravelSeconds(0)).toThrow(/finite positive/);
    expect(() => calculateLightTravelSeconds(-500)).toThrow(/finite positive/);
    expect(() => calculateLightTravelSeconds(NaN)).toThrow(/finite positive/);
    expect(() => calculateLightTravelSeconds(Infinity)).toThrow(/finite positive/);
  });

  it('computes exact light travel time for the Moon (~1.3 seconds)', () => {
    const moon = getLightTargetById('body:Moon')!;
    expect(moon).toBeDefined();

    const meters = distanceToMeters(moon.distanceValue, moon.distanceUnit);
    expect(meters).toBe(384_400_000);

    const seconds = calculateLightTravelSeconds(meters);
    // 384,400,000 / 299,792,458 = ~1.2822 seconds
    expect(seconds).toBeCloseTo(1.2822, 2);

    const formatted = formatLightTravelDuration(seconds);
    expect(formatted).toBe('1.3 seconds');
  });

  it('computes exact light travel time for the Sun (~8.3 minutes)', () => {
    const sun = getLightTargetById('body:Sun')!;
    expect(sun).toBeDefined();

    const meters = distanceToMeters(sun.distanceValue, sun.distanceUnit);
    expect(meters).toBe(149_597_870_700);

    const seconds = calculateLightTravelSeconds(meters);
    // 149,597,870,700 / 299,792,458 = 499.00478 seconds
    expect(seconds).toBeCloseTo(499.005, 1);

    const formatted = formatLightTravelDuration(seconds);
    expect(formatted).toBe('8.3 minutes');
  });

  it('computes light travel time for Proxima Centauri (~4.25 years)', () => {
    const proxima = getLightTargetById('star:proxima-centauri')!;
    expect(proxima).toBeDefined();

    const meters = distanceToMeters(proxima.distanceValue, proxima.distanceUnit);
    const seconds = calculateLightTravelSeconds(meters);

    const formatted = formatLightTravelDuration(seconds);
    expect(formatted).toBe('4.25 years');
  });

  it('computes light travel time for Andromeda Galaxy (~2.5 million years)', () => {
    const andromeda = getLightTargetById('messier:31')!;
    expect(andromeda).toBeDefined();

    const meters = distanceToMeters(andromeda.distanceValue, andromeda.distanceUnit);
    const seconds = calculateLightTravelSeconds(meters);

    const formatted = formatLightTravelDuration(seconds);
    expect(formatted).toBe('2.5 million years');
  });

  it('normalizes logarithmic distance scale monotonically between min and max bounds', () => {
    const minM = distanceToMeters(384400, 'km'); // Moon
    const maxM = distanceToMeters(2500000, 'ly'); // Andromeda

    // Exact endpoints
    expect(distanceToLogScale(minM, minM, maxM)).toBe(0);
    expect(distanceToLogScale(maxM, minM, maxM)).toBe(1);

    // Monotonic progression
    const sunM = distanceToMeters(1, 'AU');
    const proximaM = distanceToMeters(4.2465, 'ly');

    const sunFraction = distanceToLogScale(sunM, minM, maxM);
    const proximaFraction = distanceToLogScale(proximaM, minM, maxM);

    expect(sunFraction).toBeGreaterThan(0);
    expect(proximaFraction).toBeGreaterThan(sunFraction);
    expect(proximaFraction).toBeLessThan(1);

    // Clamps out-of-range values
    expect(distanceToLogScale(minM / 10, minM, maxM)).toBe(0);
    expect(distanceToLogScale(maxM * 10, minM, maxM)).toBe(1);
    expect(distanceToLogScale(-1, minM, maxM)).toBe(0);
  });

  it('formats human distance strings honestly', () => {
    expect(formatDistanceKm(384_400_000)).toBe('384,400 km');
    expect(formatDistanceKm(149_597_870_700)).toContain('149,597,871 km');
    expect(formatDistanceKm(distanceToMeters(2500000, 'ly'))).toContain('km');
    expect(formatDistanceKm(0)).toBe('0 km');
  });
});

describe('LightTrace Reference Targets & Catalog Provenance (S01–S06, S13)', () => {
  it('supplies authoritative targets with verified citations and definitions', () => {
    const all = getAllLightTargets();
    expect(all.length).toBeGreaterThanOrEqual(4);

    const studyIds = new Set(studyEntries.map(e => e.id));

    for (const target of all) {
      expect(target.id).toBeTruthy();
      expect(target.name).toBeTruthy();
      expect(target.description).toBeTruthy();
      expect(target.distanceValue).toBeGreaterThan(0);
      expect(['km', 'AU', 'ly', 'pc']).toContain(target.distanceUnit);
      expect(target.distanceDefinition).toBeTruthy();
      expect(target.referenceFrame).toBeTruthy();
      expect(target.humanContext).toBeTruthy();
      expect(target.sources.length).toBeGreaterThan(0);

      for (const src of target.sources) {
        expect(src.url.startsWith('https://')).toBe(true);
        expect(src.publisher).toBeTruthy();
      }

      // Check linked Space Study chapter if declared
      if (target.studyId) {
        expect(studyIds.has(target.studyId)).toBe(true);
      }
    }
  });
});
