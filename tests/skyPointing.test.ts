import { magneticDeclination, viewFromSensors } from '../src/features/sky/pointing';
import { project } from '../src/features/sky/projection';

it('corrects magnetic headings across north and rejects uncalibrated or unavailable readings', () => {
  expect(magneticDeclination(4, 359, 3)).toBe(5);
  expect(magneticDeclination(359, 4, 3)).toBe(-5);
  expect(magneticDeclination(-1, 8, 3)).toBeNull();
  expect(magneticDeclination(12, 8, 1)).toBeNull();
});

it('points the portrait chart at a true bearing corrected from its magnetic bearing', () => {
  const view = viewFromSensors({ x: 0, y: -9.81, z: 0 }, { x: 0, y: -18, z: -37 }, 12)!;
  const target = project({ azimuth: 12, altitude: 0 }, view, { width: 300, height: 200 })!;
  expect(target.x).toBeCloseTo(150);
  expect(target.y).toBeCloseTo(100);
});

it('uses tilt to centre an object overhead and rejects strong or vertical magnetic interference', () => {
  const factor = Math.SQRT1_2;
  const gravity = { x: 0, y: -9.81 * factor, z: 9.81 * factor };
  const tilted = viewFromSensors(gravity, { x: 0, y: -40 * factor, z: -40 * factor }, 0)!;
  const overhead = project({ azimuth: 0, altitude: 45 }, tilted, { width: 300, height: 200 })!;
  expect(overhead.x).toBeCloseTo(150);
  expect(overhead.y).toBeCloseTo(100);
  expect(viewFromSensors(gravity, { x: 150, y: 0, z: 0 }, 0)).toBeNull();
  expect(viewFromSensors(gravity, { x: 0, y: -35 * factor, z: 35 * factor }, 0)).toBeNull();
});
