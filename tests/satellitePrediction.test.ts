import { eciToGeodetic, gstime, json2satrec, propagate, radiansToDegrees } from 'satellite.js';
import { parseSatelliteElements, validateSatelliteResponse } from '../src/features/sky/satelliteElements';
import { orbitAge, predictSatellite } from '../src/features/sky/satellitePrediction';
import { colombo } from '../src/features/sky/skyMath';

// A fixed, synthetic low Earth orbit used only to exercise parsing and propagation.
const omm = {
  NORAD_CAT_ID: 25544,
  OBJECT_NAME: 'ISS fixture',
  OBJECT_ID: '1998-067A',
  EPOCH: '2026-11-23T12:00:00.123456',
  MEAN_MOTION: 15.49,
  ECCENTRICITY: 0.0004,
  INCLINATION: 51.64,
  RA_OF_ASC_NODE: 25,
  ARG_OF_PERICENTER: 218,
  MEAN_ANOMALY: 145,
  EPHEMERIS_TYPE: 0,
  ELEMENT_SET_NO: 999,
  BSTAR: 0.00018,
  MEAN_MOTION_DOT: 0.00029,
  MEAN_MOTION_DDOT: 0,
};
const epoch = Date.parse('2026-11-23T12:00:00.123Z');
const hour = 3_600_000;

it('normalizes CelesTrak UTC epochs and rejects malformed, mismatched or unsupported elements', () => {
  expect(validateSatelliteResponse([omm], 25544)).toMatchObject({
    epochAt: epoch, data: { EPOCH: '2026-11-23T12:00:00.123Z' },
  });
  expect(validateSatelliteResponse([omm], 20580)).toBeNull();
  expect(validateSatelliteResponse([omm, omm], 25544)).toBeNull();
  expect(validateSatelliteResponse([{ ...omm, ECCENTRICITY: 1.1 }], 25544)).toBeNull();
  expect(validateSatelliteResponse([{ ...omm, TIME_SYSTEM: 'TAI' }], 25544)).toBeNull();
  expect(parseSatelliteElements({ ...omm, EPOCH: '2026-02-30T12:00:00' }, 25544)).toBeNull();
});

it('computes the observing direction and moves the satellite as time advances', () => {
  const elements = validateSatelliteResponse([omm], 25544)!;
  const row = { noradId: 25544, elements, downloadedAt: epoch, failure: null } as const;
  const date = new Date(epoch);
  const eci = propagate(json2satrec(elements.data), date)!.position;
  const subpoint = eciToGeodetic(eci, gstime(date));
  const observer = { latitude: radiansToDegrees(subpoint.latitude), longitude: radiansToDegrees(subpoint.longitude), elevation: 0 };
  const overhead = predictSatellite(row, observer, epoch)!;
  expect(overhead.altitude).toBeCloseTo(90, 2);
  expect(overhead.id).toBe('satellite:25544');
  expect(predictSatellite(row, observer, epoch + 60_000)!.altitude).toBeLessThan(85);
  expect(predictSatellite(row, { ...observer, latitude: -observer.latitude, longitude: observer.longitude - 180 }, epoch)!.altitude)
    .toBeLessThan(0);
});

it('marks a prediction old at 24 hours and suppresses it at 72 hours', () => {
  const elements = validateSatelliteResponse([omm], 25544)!;
  const row = { noradId: 25544, elements, downloadedAt: epoch, failure: 'unavailable' } as const;
  expect(orbitAge(epoch, epoch + 24 * hour - 1)).toBe('fresh');
  expect(predictSatellite(row, colombo, epoch + 24 * hour)?.prediction).toEqual({ epochAt: epoch, older: true });
  expect(predictSatellite(row, colombo, epoch + 72 * hour)).toBeNull();
  expect(predictSatellite({ ...row, elements: null }, colombo, epoch)).toBeNull();
});
