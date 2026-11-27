import { CultureOverlay, validateCultureOverlay } from './types';
import manifestData from './manifest.json';
import brightStars from '../bright-stars.json';

const availableStarHips = new Set<number>(brightStars.map((s) => s.hip));

export const cultureOverlays: CultureOverlay[] = manifestData.cultures.map((c) =>
  validateCultureOverlay(c, availableStarHips)
);

export async function listCultureOverlays(): Promise<CultureOverlay[]> {
  return cultureOverlays;
}

export async function getCultureOverlayById(id: string): Promise<CultureOverlay | null> {
  const match = cultureOverlays.find((c) => c.id === id);
  if (!match) return null;
  return match;
}

export function validateAllCultures(): boolean {
  for (const c of manifestData.cultures) {
    validateCultureOverlay(c, availableStarHips);
  }
  return true;
}
