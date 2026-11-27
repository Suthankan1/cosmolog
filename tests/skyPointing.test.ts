import {
  anglesFromView,
  cardinalDirection,
  deriveInstrumentReading,
  magneticDeclination,
  viewFromSensors,
} from '../src/features/sky/pointing';
import { project, viewFromAngles } from '../src/features/sky/projection';

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

describe('Celestial Field Instrument (F06) - Pure Mathematical Model', () => {
  it('maps compass bearings to 16 cardinal direction labels correctly', () => {
    expect(cardinalDirection(0)).toBe('N');
    expect(cardinalDirection(360)).toBe('N');
    expect(cardinalDirection(45)).toBe('NE');
    expect(cardinalDirection(90)).toBe('E');
    expect(cardinalDirection(135)).toBe('SE');
    expect(cardinalDirection(180)).toBe('S');
    expect(cardinalDirection(225)).toBe('SW');
    expect(cardinalDirection(270)).toBe('W');
    expect(cardinalDirection(315)).toBe('NW');
    expect(cardinalDirection(15)).toBe('NNE');
    expect(cardinalDirection(340)).toBe('NNW');
    expect(cardinalDirection(350)).toBe('N');
  });

  it('extracts spherical azimuth and altitude angles from a 3D view direction', () => {
    // North at horizon
    const northHorizon = viewFromAngles({ azimuth: 0, altitude: 0 });
    const northAngles = anglesFromView(northHorizon);
    expect(northAngles.azimuth).toBeCloseTo(0, 1);
    expect(northAngles.altitude).toBeCloseTo(0, 1);

    // East at +30 degrees altitude
    const eastElevated = viewFromAngles({ azimuth: 90, altitude: 30 });
    const eastAngles = anglesFromView(eastElevated);
    expect(eastAngles.azimuth).toBeCloseTo(90, 1);
    expect(eastAngles.altitude).toBeCloseTo(30, 1);

    // South at +60 degrees altitude
    const southElevated = viewFromAngles({ azimuth: 180, altitude: 60 });
    const southAngles = anglesFromView(southElevated);
    expect(southAngles.azimuth).toBeCloseTo(180, 1);
    expect(southAngles.altitude).toBeCloseTo(60, 1);

    // West at horizon
    const westHorizon = viewFromAngles({ azimuth: 270, altitude: 0 });
    const westAngles = anglesFromView(westHorizon);
    expect(westAngles.azimuth).toBeCloseTo(270, 1);
    expect(westAngles.altitude).toBeCloseTo(0, 1);
  });

  it('derives instrument reading with true reference when declination is available', () => {
    const now = 10000;
    const gravity = { x: 0, y: -9.81, z: 0 };
    const field = { x: 0, y: -18, z: -37 }; // valid field strength ~41 uT
    const reading = deriveInstrumentReading(gravity, field, 12, now, now - 100, now - 100);

    expect(reading.status).toBe('ready');
    if (reading.status === 'ready') {
      expect(reading.reference).toBe('true');
      expect(reading.quality).toBe('calibrated');
      expect(reading.declination).toBe(12);
      expect(reading.cardinal).toBeDefined();
      expect(reading.fieldStrength).toBeCloseTo(41.1, 1);
    }
  });

  it('falls back to magnetic reference without false labeling when declination is null', () => {
    const now = 10000;
    const gravity = { x: 0, y: -9.81, z: 0 };
    const field = { x: 0, y: -18, z: -37 };
    const reading = deriveInstrumentReading(gravity, field, null, now, now - 100, now - 100);

    expect(reading.status).toBe('ready');
    if (reading.status === 'ready') {
      expect(reading.reference).toBe('magnetic');
      expect(reading.quality).toBe('uncalibrated');
      expect(reading.declination).toBeNull();
    }
  });

  it('detects magnetic interference and rejects abnormal field strengths', () => {
    const now = 10000;
    const gravity = { x: 0, y: -9.81, z: 0 };

    // Too weak (< 15 uT)
    const weakField = { x: 0, y: 5, z: 5 }; // ~7 uT
    const weakReading = deriveInstrumentReading(gravity, weakField, null, now, now - 100, now - 100);
    expect(weakReading.status).toBe('calibrating');
    if (weakReading.status === 'calibrating') {
      expect(weakReading.reason).toBe('interference');
    }

    // Too strong (> 100 uT)
    const strongField = { x: 100, y: 80, z: 50 }; // ~137 uT
    const strongReading = deriveInstrumentReading(gravity, strongField, null, now, now - 100, now - 100);
    expect(strongReading.status).toBe('calibrating');
    if (strongReading.status === 'calibrating') {
      expect(strongReading.reason).toBe('interference');
    }
  });

  it('rejects stale sensor samples older than 1500 ms', () => {
    const now = 10000;
    const gravity = { x: 0, y: -9.81, z: 0 };
    const field = { x: 0, y: -18, z: -37 };

    // Motion stale
    const staleMotionReading = deriveInstrumentReading(gravity, field, null, now, now - 1600, now - 100);
    expect(staleMotionReading.status).toBe('calibrating');
    if (staleMotionReading.status === 'calibrating') {
      expect(staleMotionReading.reason).toBe('stale');
    }

    // Field stale
    const staleFieldReading = deriveInstrumentReading(gravity, field, null, now, now - 100, now - 1600);
    expect(staleFieldReading.status).toBe('calibrating');
    if (staleFieldReading.status === 'calibrating') {
      expect(staleFieldReading.reason).toBe('stale');
    }
  });

  it('handles missing sensor vectors gracefully', () => {
    const now = 10000;
    expect(deriveInstrumentReading(undefined, undefined, null, now, 0, 0).status).toBe('calibrating');
    expect(deriveInstrumentReading({ x: 0, y: -9.81, z: 0 }, undefined, null, now, now, now).status).toBe('calibrating');
  });
});
