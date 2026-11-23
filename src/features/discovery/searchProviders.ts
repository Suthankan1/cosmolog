import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNewsPage } from '../../services/api/spaceflightNewsService';
import { upsertDiscoveryItems } from '../../database/repositories/discoveryRepository';
import type { DiscoveryItem } from '../../database/models';

export const providers = {
  'spaceflight-news': {
    label: 'Spaceflight News',
    fetch: (query: string, offset: number, signal: AbortSignal) => fetchNewsPage(offset, null, query, signal),
  },
};
export type Provider = keyof typeof providers;
export const fetchSearchPage = createAsyncThunk('discovery/searchPage',
  async ({ provider, query, offset }: { provider: Provider; query: string; offset: number }, { signal }) => {
    const page = await providers[provider].fetch(query, offset, signal);
    if (signal.aborted) throw new Error('Search changed');
    await upsertDiscoveryItems(page.items);
    return page;
  });

export function mergeSearch(local: DiscoveryItem[], online: DiscoveryItem[][]) {
  const ids = new Set<string>();
  const links = new Set<string>();
  const rows: DiscoveryItem[] = [];
  const add = (item: DiscoveryItem) => {
    let link = item.canonicalUrl;
    if (link) {
      const url = new URL(link);
      url.hash = '';
      link = url.href;
    }
    if (ids.has(item.localId) || (link && links.has(link))) return;
    ids.add(item.localId);
    if (link) links.add(link);
    rows.push(item);
  };
  local.forEach(add);
  const localCount = rows.length;
  const longest = Math.max(0, ...online.map(items => items.length));
  for (let i = 0; i < longest; i++) {
    for (const items of online) if (items[i]) add(items[i]);
  }
  return { rows, localCount };
}
