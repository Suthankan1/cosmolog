import type { useRouter } from 'expo-router';

export const discoverySources = ['nasa-apod', 'spaceflight-news'] as const;
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

export function isNewsId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

export function parseDetailsParams(params: {
  source?: string | string[];
  id?: string | string[];
}): DetailsRouteParams | null {
  const source = Array.isArray(params.source) && params.source.length === 1 ? params.source[0] : params.source;
  const id = Array.isArray(params.id) && params.id.length === 1 ? params.id[0] : params.id;
  if (typeof id !== 'string' || (source !== 'nasa-apod' && source !== 'spaceflight-news')) return null;

  return (source === 'nasa-apod' ? isCalendarDate(id) : isNewsId(id)) ? { source, id } : null;
}

export function navigateToDetails(router: Pick<ReturnType<typeof useRouter>, 'push'>, source: DiscoverySource, id: string): void {
  router.push({ pathname: '/details/[source]/[id]', params: { source, id } });
}
