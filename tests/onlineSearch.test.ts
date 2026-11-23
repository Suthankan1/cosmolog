import { fetchNewsPage } from "../src/services/api/spaceflightNewsService";
import { parseMediaPage } from '../src/services/api/nasaMediaService';
import { mergeSearch, widerWebUrl } from '../src/features/discovery/searchProviders';
import { parseDetailsParams } from '../src/navigation/types';

const entry = (id: string, type: string) => ({ data: [{ nasa_id: id, title: 'Europa', media_type: type,
  center: 'JPL', secondary_creator: 'Galileo team', date_created: '1997-04-02', description: 'Ice.' }] });
it('normalizes image, audio and video records, preserving identifiers and creator credit', () => {
  const page = parseMediaPage({ collection: { items: [entry('Europa 1', 'image'), entry('A', 'audio'), entry('V', 'video')],
    links: [{ rel: 'next' }] } }, 1);
  expect(page.nextOffset).toBe(2);
  expect(page.items.map(x => x.mediaType)).toEqual(['image', 'audio', 'video']);
  expect(page.items[0]).toMatchObject({ canonicalUrl: 'https://images.nasa.gov/details/Europa%201', imageRemoteUrl: null, author: 'Galileo team' });
  expect(parseDetailsParams({ source: 'nasa-media', id: 'Europa 1' })).toBeTruthy();
  expect(parseDetailsParams({ source: 'nasa-media', id: '../secret' })).toBeNull();
});
it('interleaves providers, preserving local priority and removing duplicate source links', () => {
  const { items } = parseMediaPage({ collection: { items: ['a','b','c','d'].map(id => entry(id,'image')) } }, 0);
  const duplicate = { ...items[0], localId: 'other', canonicalUrl: items[0].canonicalUrl + '#credit' };
  expect(mergeSearch([items[0]], [[items[1], items[2]], [duplicate, items[3]]]).rows).toEqual(items);
});
it('encodes the whole wider web query and only targets the search engine', () => {
  const url = new URL(widerWebUrl('  Europa & ice?  '));
  expect(url.hostname).toBe('search.brave.com');
  expect(url.searchParams.get('q')).toBe('Europa & ice? astronomy space science');
});

it('keeps provider date precision for the anchored news continuation', async () => {
  const transport = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, json: async () => ({ next: 'next', results: [{ id: 1, title: 'Ice', summary: 'Europa',
      published_at: '2026-11-23T12:00:00.123456Z' }] }),
  } as Response);
  try {
    const page = await fetchNewsPage();
    await fetchNewsPage(page.nextOffset!, page.anchor);
    const url = new URL(String(transport.mock.calls[1][0]));
    expect(url.searchParams.get('published_at_lte')).toBe('2026-11-23T12:00:00.123456Z');
    expect(url.searchParams.get('ordering')).toBe('-published_at');
  } finally { transport.mockRestore(); }
});
