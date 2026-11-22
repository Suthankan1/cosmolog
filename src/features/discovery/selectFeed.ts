import type { DiscoveryItem } from '../../database/models';
import type { DiscoverySource } from '../../navigation/types';

export function selectFeed(items: DiscoveryItem[], category: 'all' | DiscoverySource) {
  const plates = items.filter(item => item.source === 'nasa-apod');
  const plateLinks = new Set(plates.map(item => item.canonicalUrl).filter(Boolean));
  const dispatches = items.filter(item => item.source === 'spaceflight-news' && (
    !item.canonicalUrl || !plateLinks.has(item.canonicalUrl)
  ));

  const hero = category === 'all' ? plates[0] ?? null : null;
  const rows = category === 'nasa-apod' ? plates : category === 'spaceflight-news' || dispatches.length
    ? dispatches : plates.filter(item => item !== hero);
  return { hero, rows };
}
