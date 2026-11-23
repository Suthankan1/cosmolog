import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../../store';
import type { DiscoveryItem } from '../../database/models';
import { readSearch, saveSearch, searchLibrary, type SearchCategory } from './librarySearch';
import { fetchSearchPage, mergeSearch, providers, type Provider } from './searchProviders';

interface Stream { provider: Provider; items: DiscoveryItem[]; next: number | null; error: boolean }
interface SearchView {
  key: string; rows: DiscoveryItem[]; localCount: number; pending: boolean; errors: string[]; more: boolean;
}
const blank = { rows: [], localCount: 0, pending: true, errors: [], more: false };

export function useLibrarySearch(account: number | undefined, category: SearchCategory, query: string, online: boolean) {
  const dispatch = useAppDispatch();
  const term = query.trim();
  const key = JSON.stringify([account, category, term, online]);
  const [view, setView] = useState<SearchView>();
  const actions = useRef<{ more(): void; retry(): void } | null>(null);

  useEffect(() => {
    if (!account || !term) return;
    const controller = new AbortController();
    const { signal } = controller;
    const streams: Stream[] = (Object.keys(providers) as Provider[])
      .filter(id => online && term.replace(/\s/g, '').length >= 2 && (category === 'all' || id === category))
      .map(provider => ({ provider, items: [], next: 0, error: false }));
    let local: DiscoveryItem[] = [];
    let limit = 30;
    let total = 0;
    let localError = false;
    let saveError = false;
    let busy = true;

    const merged = () => mergeSearch(local, streams.map(stream => stream.items));
    const publish = () => {
      if (signal.aborted) return;
      const { rows, localCount } = merged();
      const errors = streams.filter(s => s.error).map(s => providers[s.provider].label);
      if (localError) errors.push('Device library');
      if (saveError) errors.push('Offline copy');
      setView({ key, rows, localCount, pending: busy, errors, more: total > limit || streams.some(s => s.next !== null && !s.error) });
    };
    const loadLocal = async () => {
      try {
        const page = await searchLibrary(account, category, term, limit);
        const saved = !online ? await readSearch(account, category, term) : [];
        local = mergeSearch(saved, [page.items]).rows;
        total = page.total;
        localError = false;
      } catch { localError = true; }
      publish();
    };
    const loadStream = async (s: Stream) => {
      if (s.next === null) return;
      try {
        const page = await dispatch(fetchSearchPage({ provider: s.provider, query: term, offset: s.next }, { signal })).unwrap();
        s.items.push(...page.items);
        s.next = page.nextOffset;
        s.error = false;
      } catch { s.error = true; }
      publish();
    };
    const finish = async () => {
      if (!signal.aborted && online && !localError && (streams.length === 0 || streams.some(s => !s.error))) {
        try { await saveSearch(account, category, term, merged().rows, signal); saveError = false; }
        catch { saveError = true; }
      }
      busy = false;
      publish();
    };
    const advance = async (retry: boolean) => {
      if (busy || signal.aborted) return;
      busy = true;
      const work: Promise<void>[] = [];
      if ((retry && localError) || (!retry && total > limit)) {
        if (!retry) limit += 30;
        work.push(loadLocal());
      }
      publish();
      await Promise.all([...work, ...streams.filter(s => s.error === retry).map(loadStream)]);
      await finish();
    };
    actions.current = { more: () => void advance(false), retry: () => void advance(true) };
    const device = loadLocal();
    const timer = setTimeout(() => {
      void Promise.all([device, ...streams.map(loadStream)]).then(finish);
    }, streams.length ? 400 : 0);
    return () => { controller.abort(); clearTimeout(timer); actions.current = null; };
  }, [account, category, dispatch, key, online, term]);
  return { ...(view?.key === key ? view : blank),
    moreResults: () => actions.current?.more(), retry: () => actions.current?.retry() };
}
