import type { DiscoveryItem } from '../../database/models';
import type { DiscoverySource } from '../../navigation/types';

export function selectFeed(items: DiscoveryItem[], category: 'all' | DiscoverySource) {
  const edition = items.filter(item => category === 'all' || item.source === category)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || a.localId.localeCompare(b.localId));
  const hero = (category === 'all' && edition.find(item => item.source === 'nasa-apod')) || edition[0] || null;
  const links = new Set(hero?.canonicalUrl ? [hero.canonicalUrl] : []);
  const rows = edition.filter(item => {
    if (item.localId === hero?.localId) return false;
    if (!item.canonicalUrl) return true;
    if (links.has(item.canonicalUrl)) return false;
    links.add(item.canonicalUrl);
    return true;
  });
  return { hero, rows };
}
