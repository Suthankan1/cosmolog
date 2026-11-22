import type { FavouriteDiscoveryItem } from '../../database/repositories/favouritesRepository';

export type ShelfSort = 'saved' | 'published';

export function selectShelf(entries: FavouriteDiscoveryItem[], filters: {
  query: string;
  withNotes: boolean;
  downloaded: boolean;
  sort: ShelfSort;
}) {
  const query = filters.query.trim().toLocaleLowerCase();
  const matches = entries.filter(entry => (
    (!filters.withNotes || Boolean(entry.note)) &&
    (!filters.downloaded || (entry.mediaStatus === 'ready' || entry.mediaStatus === 'previous')) &&
    (!query || [entry.title, entry.attribution, entry.note, entry.source === 'nasa-apod' ? 'NASA APOD' : null]
      .some(field => field?.toLocaleLowerCase().includes(query)))
  ));

  if (filters.sort === 'published') {
    matches.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') ||
      b.addedAt.localeCompare(a.addedAt) || a.localId.localeCompare(b.localId));
  }
  return matches;
}
