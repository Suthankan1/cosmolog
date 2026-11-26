import {
  SPEED_OF_LIGHT_KMH,
  calculateDiameterRatio,
  calculateHypotheticalTravelTime,
  formatScaleDuration,
  formatScaleKm,
  calculateProportionalBarWidth,
} from '../src/features/labs/scaleMath';
import {
  COSMIC_SCALE_BODIES,
  TRAVEL_SPEED_PRESETS,
  getCosmicBodyById,
} from '../src/features/labs/data/scale';

describe('Cosmic Scale Laboratory Pure Math Engine (F04)', () => {
  describe('Authoritative Reference Dataset (S01, S05)', () => {
    it('defines BIPM derived speed of light in km/h', () => {
      expect(SPEED_OF_LIGHT_KMH).toBeCloseTo(1_079_252_848.8, 1);
    });

    it('contains all curated planetary and celestial bodies with explicit volumetric mean convention', () => {
      expect(COSMIC_SCALE_BODIES.length).toBeGreaterThanOrEqual(7);

      const earth = getCosmicBodyById('earth');
      expect(earth).toBeDefined();
      expect(earth?.diameterKm).toBe(12_742);
      expect(earth?.diameterConvention).toBe('Mean volumetric diameter');
      expect(earth?.meanSunDistanceKm).toBe(149_598_026);
      expect(earth?.meanSunDistanceAU).toBe(1.0);
      expect(earth?.meanEarthDistanceKm).toBe(0);

      const moon = getCosmicBodyById('moon');
      expect(moon).toBeDefined();
      expect(moon?.diameterKm).toBe(3_475);
      expect(moon?.meanEarthDistanceKm).toBe(384_400);

      const sun = getCosmicBodyById('sun');
      expect(sun).toBeDefined();
      expect(sun?.diameterKm).toBe(1_392_700);

      const jupiter = getCosmicBodyById('jupiter');
      expect(jupiter).toBeDefined();
      expect(jupiter?.diameterKm).toBe(139_820);

      const saturn = getCosmicBodyById('saturn');
      expect(saturn).toBeDefined();
      expect(saturn?.diameterKm).toBe(116_460);
      expect(saturn?.expeditionId).toBe('saturn');
    });

    it('retains authoritative source citations for every body', () => {
      for (const body of COSMIC_SCALE_BODIES) {
        expect(body.sources.length).toBeGreaterThan(0);
        for (const src of body.sources) {
          expect(src.id).toBeDefined();
          expect(src.title).toBeDefined();
          expect(src.publisher).toBeDefined();
          expect(src.url).toMatch(/^https:\/\//);
        }
      }
    });

    it('clearly separates heliocentric semi-major axis from geocentric distance', () => {
      const mars = getCosmicBodyById('mars');
      expect(mars).toBeDefined();
      // Heliocentric semi-major axis is ~227.9M km (~1.524 AU)
      expect(mars?.meanSunDistanceKm).toBe(227_943_824);
      // Average Earth-Mars distance is ~225M km, ranging from 54.6M to 401M km
      expect(mars?.meanEarthDistanceKm).toBe(225_000_000);
      expect(mars?.minEarthDistanceKm).toBe(54_600_000);
      expect(mars?.maxEarthDistanceKm).toBe(401_000_000);
    });

    it('defines realistic speed presets strictly below c', () => {
      for (const preset of TRAVEL_SPEED_PRESETS) {
        expect(preset.speedKmPerHour).toBeGreaterThan(0);
        expect(preset.speedKmPerHour).toBeLessThan(SPEED_OF_LIGHT_KMH);
      }
    });
  });

  describe('Diameter Ratio Calculation (calculateDiameterRatio)', () => {
    const earth = getCosmicBodyById('earth')!;
    const sun = getCosmicBodyById('sun')!;
    const moon = getCosmicBodyById('moon')!;
    const jupiter = getCosmicBodyById('jupiter')!;

    it('yields 1.0 for same-body ratio', () => {
      expect(calculateDiameterRatio(earth.diameterKm, earth.diameterKm)).toBe(1.0);
      expect(calculateDiameterRatio(sun.diameterKm, sun.diameterKm)).toBe(1.0);
    });

    it('calculates correct celestial ratios against Earth baseline', () => {
      // Sun to Earth: ~109.30x
      const sunRatio = calculateDiameterRatio(sun.diameterKm, earth.diameterKm);
      expect(sunRatio).toBeCloseTo(109.30, 1);

      // Jupiter to Earth: ~10.97x
      const jupiterRatio = calculateDiameterRatio(jupiter.diameterKm, earth.diameterKm);
      expect(jupiterRatio).toBeCloseTo(10.97, 1);

      // Moon to Earth: ~0.2727x
      const moonRatio = calculateDiameterRatio(moon.diameterKm, earth.diameterKm);
      expect(moonRatio).toBeCloseTo(0.27, 2);
    });

    it('rejects invalid, zero, or negative diameters', () => {
      expect(() => calculateDiameterRatio(0, 1000)).toThrow('finite positive');
      expect(() => calculateDiameterRatio(1000, 0)).toThrow('finite positive');
      expect(() => calculateDiameterRatio(-100, 1000)).toThrow('finite positive');
      expect(() => calculateDiameterRatio(NaN, 1000)).toThrow('finite positive');
    });
  });

  describe('Hypothetical Constant-Speed Travel Time (calculateHypotheticalTravelTime)', () => {
    it('calculates travel time for commercial airliner (900 km/h) to the Moon (384,400 km)', () => {
      const result = calculateHypotheticalTravelTime(384_400, 900);
      expect(result.hours).toBeCloseTo(427.11, 1);
      expect(result.days).toBeCloseTo(17.80, 1);
      expect(result.formatted).toBe('17.8 days');
    });

    it('calculates travel time for Voyager 1 (61,200 km/h) to Mars average distance (225M km)', () => {
      const result = calculateHypotheticalTravelTime(225_000_000, 61_200);
      expect(result.hours).toBeCloseTo(3_676.47, 1);
      expect(result.days).toBeCloseTo(153.19, 1);
      expect(result.formatted).toBe('153.2 days');
    });

    it('calculates travel time for Parker Solar Probe (692,000 km/h) to Sun (149.6M km)', () => {
      const result = calculateHypotheticalTravelTime(149_598_026, 692_000);
      expect(result.hours).toBeCloseTo(216.18, 1);
      expect(result.days).toBeCloseTo(9.01, 1);
      expect(result.formatted).toBe('9.0 days');
    });

    it('rejects travel speeds equal to or exceeding the speed of light c', () => {
      expect(() => calculateHypotheticalTravelTime(1_000_000, SPEED_OF_LIGHT_KMH)).toThrow(
        'must be strictly below the speed of light c',
      );
      expect(() => calculateHypotheticalTravelTime(1_000_000, SPEED_OF_LIGHT_KMH + 1000)).toThrow(
        'must be strictly below the speed of light c',
      );
    });

    it('rejects zero or negative speeds and distances', () => {
      expect(() => calculateHypotheticalTravelTime(0, 1000)).toThrow('Distance must be a finite positive number');
      expect(() => calculateHypotheticalTravelTime(-500, 1000)).toThrow('Distance must be a finite positive number');
      expect(() => calculateHypotheticalTravelTime(1000, 0)).toThrow('Speed must be a finite positive number');
      expect(() => calculateHypotheticalTravelTime(1000, -100)).toThrow('Speed must be a finite positive number');
    });
  });

  describe('Duration & Distance Formatting Helpers', () => {
    it('formats durations across scales (minutes, hours, days, years, millions of years)', () => {
      expect(formatScaleDuration(0.5)).toBe('30.0 minutes');
      expect(formatScaleDuration(12)).toBe('12.0 hours');
      expect(formatScaleDuration(72)).toBe('3.0 days');
      expect(formatScaleDuration(24 * 500)).toBe('1.37 years');
      expect(formatScaleDuration(24 * 365.25 * 50)).toBe('50.0 years');
      expect(formatScaleDuration(24 * 365.25 * 2_500_000)).toBe('2.50 million years');
    });

    it('formats distances in km, millions of km, and billions of km', () => {
      expect(formatScaleKm(384_400)).toBe('384,400 km');
      expect(formatScaleKm(149_598_026)).toBe('149.6 million km');
      expect(formatScaleKm(1_433_529_000)).toBe('1.43 billion km');
    });

    it('calculates proportional bar percentage bounded between min and 100', () => {
      expect(calculateProportionalBarWidth(50, 100)).toBe(50);
      expect(calculateProportionalBarWidth(100, 100)).toBe(100);
      expect(calculateProportionalBarWidth(0.5, 100, 3)).toBe(3);
      expect(calculateProportionalBarWidth(200, 100)).toBe(100);
      expect(calculateProportionalBarWidth(-10, 100)).toBe(3);
    });
  });
});
