import brightStars from '../bright-stars.json';
import { CultureStarRef } from './types';

export interface ProjectedCultureStar {
  hip: number;
  x: number;
  y: number;
  ra: number;
  dec: number;
  magnitude: number;
  name: string;
  nativeName: string;
  role?: string;
}

// Bounding box for equatorial stars (RA ~5.1h to ~6.0h, Dec ~-11° to ~+9°)
const RA_MIN = 5.15;
const RA_MAX = 6.0;
const DEC_MIN = -11.0;
const DEC_MAX = 8.5;

/**
 * Projects equatorial stars onto a 2D plane with astronomical sky orientation:
 * - North is UP (+Dec)
 * - East is LEFT (+RA, as observed looking up into the night sky)
 */
export function projectCultureStar(
  hip: number,
  nativeName: string,
  width: number,
  height: number,
  padding = 32,
  role?: string
): ProjectedCultureStar | null {
  const catalogEntry = brightStars.find((s) => s.hip === hip);
  if (!catalogEntry) return null;

  const innerWidth = Math.max(10, width - padding * 2);
  const innerHeight = Math.max(10, height - padding * 2);

  // Astronomical orientation: higher RA is to the East (left)
  const normX = (RA_MAX - catalogEntry.ra) / (RA_MAX - RA_MIN);
  // Higher Dec is to the North (top, so 0 is top)
  const normY = (DEC_MAX - catalogEntry.dec) / (DEC_MAX - DEC_MIN);

  const x = padding + Math.max(0, Math.min(1, normX)) * innerWidth;
  const y = padding + Math.max(0, Math.min(1, normY)) * innerHeight;

  return {
    hip,
    x,
    y,
    ra: catalogEntry.ra,
    dec: catalogEntry.dec,
    magnitude: catalogEntry.magnitude,
    name: catalogEntry.name,
    nativeName,
    role,
  };
}

export function projectAllCultureStars(
  stars: CultureStarRef[],
  width: number,
  height: number,
  padding = 32
): Map<number, ProjectedCultureStar> {
  const map = new Map<number, ProjectedCultureStar>();
  for (const s of stars) {
    const proj = projectCultureStar(s.hip, s.nativeName, width, height, padding, s.role);
    if (proj) {
      map.set(s.hip, proj);
    }
  }
  return map;
}
