import { useEffect, useState } from 'react';
import type { DiscoverySource } from '../../navigation/types';
import { searchLibrary } from './librarySearch';

export function useLibrarySearch(accountId: number | undefined, category: 'all' | DiscoverySource, query: string, revision: string) {
  const term = query.trim();
  const key = JSON.stringify([accountId, category, term, revision]);
  const [result, setResult] = useState<{ key: string; data: Awaited<ReturnType<typeof searchLibrary>> | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!term || !accountId) return;
    let active = true;
    const timer = setTimeout(() => {
      void searchLibrary(accountId, category, term).then(
        data => { if (active) setResult({ key, data }); },
        () => { if (active) setResult({ key, data: null }); },
      );
    }, 160);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [accountId, attempt, category, key, revision, term]);
  const current = term && result?.key === key ? result : null;
  return {
    data: current?.data,
    pending: Boolean(term && !current),
    error: Boolean(current && !current.data),
    retry: () => { setResult(null); setAttempt(value => value + 1); },
  };
}
