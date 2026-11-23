import type { useRouter } from 'expo-router';

export const discoverySources = ['nasa-apod', 'spaceflight-news', 'nasa-media'] as const;
export type DiscoverySource = typeof discoverySources[number];

export interface DetailsRouteParams {
  source: DiscoverySource;
  id: string;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isMediaId(id: string): boolean {
  return id.length > 0 && id.length <= 240 && id.trim() === id && !/[/?#\\]/.test(id) &&
    id !== '.' && id !== '..' && !Array.from(id).some(char => char.charCodeAt(0) < 32);
}

export function isNewsId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

export function parseDetailsParams(params: {
  source?: string | string[];
  id?: string | string[];
}): DetailsRouteParams | null {
  const source = Array.isArray(params.source) && params.source.length === 1 ? params.source[0] : params.source;
  const id = Array.isArray(params.id) && params.id.length === 1 ? params.id[0] : params.id;
  if (typeof id !== 'string' || (source !== 'nasa-apod' && source !== 'spaceflight-news' && source !== 'nasa-media')) return null;

  return (source === 'nasa-apod' ? isCalendarDate(id) : source === 'nasa-media' ? isMediaId(id) : isNewsId(id)) ? { source, id } : null;
}

export function navigateToDetails(router: Pick<ReturnType<typeof useRouter>, 'push'>, source: DiscoverySource, id: string): void {
  router.push({ pathname: '/details/[source]/[id]', params: { source, id } });
}
