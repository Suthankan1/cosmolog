import { findSkyObject } from '../src/features/sky/catalog';
import { closestMarker, project, projectHorizon, viewFromAngles, wrapDegrees } from '../src/features/sky/projection';
import { aboveHorizon, calculateSky, colombo, parseCoordinates } from '../src/features/sky/skyMath';

const date = new Date('2026-11-23T15:00:00Z');

it('matches the US Naval Observatory Moon position at a fixed time in Colombo', () => {
  // USNO AltAz reports 51.6° altitude and 63.0° azimuth for this observer and UTC time.
  // Its altitude includes refraction, so allow 0.2° around the geometric altitude.
  const moon = calculateSky(colombo, date).find(position => position.id === 'body:Moon')!;
  expect(Math.abs(moon.altitude - 51.6)).toBeLessThan(0.2);
  expect(Math.abs(moon.azimuth - 63.0)).toBeLessThan(0.2);
});

it('uses all bundled objects and changes their altitudes with the observer and time', () => {
  const positions = calculateSky(colombo, date);
  const ids = new Set(positions.map(position => position.id));
  expect(ids.size).toBe(94);
  expect([...ids].filter(id => id.startsWith('hip:'))).toHaveLength(80);
  const above = aboveHorizon(positions);
  expect(above.length).toBeGreaterThan(0);
  expect(above.length).toBeLessThan(positions.length);
  expect(above.every(position => position.altitude >= 0)).toBe(true);
  expect(above.every((position, index) => index === 0 || above[index - 1].altitude >= position.altitude)).toBe(true);
  const antipode = calculateSky({ latitude: -colombo.latitude, longitude: colombo.longitude - 180, elevation: 0 }, date);
  expect(antipode.find(position => position.id === 'body:Moon')!.altitude).toBeLessThan(0);
  expect(calculateSky(colombo, new Date('2026-11-24T03:00:00Z')).find(position => position.id === 'body:Moon')!.altitude).toBeLessThan(0);
  expect(findSkyObject('messier:31')).toMatchObject({ name: 'Andromeda Galaxy', category: 'Galaxy' });
});

it('projects across true north, rejects points behind the phone and draws the level horizon', () => {
  const size = { width: 300, height: 200 };
  const view = viewFromAngles({ azimuth: 359, altitude: 0 });
  expect(project({ azimuth: 359, altitude: 0 }, view, size)).toEqual({ x: 150, y: 100 });
  expect(project({ azimuth: 1, altitude: 0 }, view, size)!.x).toBeGreaterThan(150);
  expect(project({ azimuth: 179, altitude: 0 }, view, size)).toBeNull();
  expect(projectHorizon(view, size)).toEqual([{ x: 300, y: 100 }, { x: 0, y: 100 }]);
  expect(wrapDegrees(-1)).toBe(359);
});

it('selects the closest marker within the touch target and ignores an empty tap', () => {
  const markers = [
    { id: 'body:Moon', x: 62, y: 77 },
    { id: 'messier:31', x: 80, y: 75 },
  ] as const;
  expect(closestMarker(markers, { x: 77, y: 76 }, 48)?.id).toBe('messier:31');
  expect(closestMarker(markers, { x: 62, y: 101 }, 48)?.id).toBe('body:Moon');
  expect(closestMarker(markers, { x: 200, y: 200 }, 48)).toBeUndefined();
});

it('accepts signed decimal coordinates and rejects blank or out-of-range input', () => {
  expect(parseCoordinates(' -33,9 ', '151.2')).toEqual({ latitude: -33.9, longitude: 151.2, elevation: 0 });
  expect(parseCoordinates('0', '0')).toEqual({ latitude: 0, longitude: 0, elevation: 0 });
  expect(parseCoordinates('', '0')).toBeNull();
  expect(parseCoordinates('7', '181')).toBeNull();
});
