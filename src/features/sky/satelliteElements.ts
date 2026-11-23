import { json2satrec, propagate } from 'satellite.js';
import { z } from 'zod';

const angle = z.number().min(0).max(360);
const elementsSchema = z.object({
  NORAD_CAT_ID: z.number().int().positive(),
  OBJECT_NAME: z.string().trim().min(1).max(100),
  OBJECT_ID: z.string().trim().max(30),
  EPOCH: z.string(),
  MEAN_MOTION: z.number().positive().max(20),
  ECCENTRICITY: z.number().min(0).lt(1),
  INCLINATION: z.number().min(0).max(180),
  RA_OF_ASC_NODE: angle,
  ARG_OF_PERICENTER: angle,
  MEAN_ANOMALY: angle,
  EPHEMERIS_TYPE: z.literal(0).optional(),
  TIME_SYSTEM: z.literal('UTC').optional(),
  REF_FRAME: z.literal('TEME').optional(),
  CENTER_NAME: z.literal('EARTH').optional(),
  MEAN_ELEMENT_THEORY: z.literal('SGP4').optional(),
  ELEMENT_SET_NO: z.number().int().nonnegative(),
  BSTAR: z.number(),
  MEAN_MOTION_DOT: z.number(),
  MEAN_MOTION_DDOT: z.number(),
});

export interface SatelliteElements {
  data: z.infer<typeof elementsSchema>;
  epochAt: number;
}

export function parseSatelliteElements(value: unknown, expectedId: number): SatelliteElements | null {
  const result = elementsSchema.safeParse(value);
  if (!result.success || result.data.NORAD_CAT_ID !== expectedId) return null;
  // CelesTrak provides UTC, often with six fractional digits and no Z suffix.
  const epoch = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z?$/.exec(result.data.EPOCH);
  if (!epoch) return null;
  const iso = `${epoch[1]}.${(epoch[2] ?? '').padEnd(3, '0').slice(0, 3)}Z`;
  const epochAt = Date.parse(iso);
  if (!Number.isFinite(epochAt) || new Date(epochAt).toISOString() !== iso) return null;
  return { data: { ...result.data, EPOCH: iso }, epochAt };
}

export function validateSatelliteResponse(value: unknown, expectedId: number): SatelliteElements | null {
  if (!Array.isArray(value) || value.length !== 1) return null;
  const parsed = parseSatelliteElements(value[0], expectedId);
  if (!parsed) return null;
  const position = propagate(json2satrec(parsed.data), new Date(parsed.epochAt))?.position;
  return position && [position.x, position.y, position.z].every(Number.isFinite) ? parsed : null;
}
