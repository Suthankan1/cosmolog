import type { DiscoveryItem } from './models';

export const foldSearch = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
export function searchFields(item: DiscoveryItem) {
  const source = item.source === 'nasa-apod' ? 'NASA APOD' : 'Spaceflight News';
  return [foldSearch(item.title), foldSearch([item.title, item.summary, item.body, item.author, item.attribution, source].join(' '))];
}
