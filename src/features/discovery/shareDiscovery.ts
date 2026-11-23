import type { DiscoveryItem } from '../../database/models';
import { httpsUrl } from '../../services/api/mediaPolicy';

type Publication = Pick<DiscoveryItem, 'title' | 'canonicalUrl' | 'author' | 'attribution' | 'source'>;

export function publicationName(item: Publication) {
  return item.source === 'nasa-apod' ? 'NASA Astronomy Picture of the Day' : item.attribution || 'Spaceflight News';
}

export function shareDiscoveryContent(item: Publication) {
  const link = httpsUrl(item.canonicalUrl);
  if (!link) return null;
  const credits = [...new Set([publicationName(item), item.author, item.attribution].filter(Boolean))];
  return { title: item.title, message: [item.title, credits.join(' · '), link].join('\n') };
}
