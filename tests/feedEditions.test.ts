import type { DiscoveryItem } from '../src/database/models';
import { selectFeed } from '../src/features/discovery/selectFeed';

function story(id: string, day: number, plate = false, link = id): DiscoveryItem {
  return { localId: id, externalId: id, source: plate ? 'nasa-apod' : 'spaceflight-news', publishedAt: '2026-11-' + day,
    title: id, summary: '', body: '', fetchedAt: '', updatedAt: '', imageRemoteUrl: null, imageLocalUri: null,
    attribution: null, author: null, mediaType: 'article', canonicalUrl: link };
}

const records = [story('early', 13, true), story('news', 23), story('cover', 20, true), story('duplicate', 19, false, 'cover')];
it.each([
  ['all', 'cover', ['news', 'early']],
  ['nasa-apod', 'cover', ['early']],
  ['spaceflight-news', 'news', ['duplicate']],
] as const)('selects the %s cover and chronological remainder', (edition, cover, rows) => {
  const result = selectFeed(records, edition);
  expect(result.hero?.localId).toBe(cover);
  expect(result.rows.map(item => item.localId)).toEqual(rows);
});
it('uses the only available dispatch and keeps an empty edition honest', () => {
  expect(selectFeed([records[1]], 'all')).toEqual({ hero: records[1], rows: [] });
  expect(selectFeed([records[1]], 'nasa-apod')).toEqual({ hero: null, rows: [] });
});
