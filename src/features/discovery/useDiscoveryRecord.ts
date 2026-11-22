import { useEffect, useState } from 'react';
import { getDiscoveryItemById, upsertDiscoveryItems } from '../../database/repositories/discoveryRepository';
import type { DiscoveryItem } from '../../database/models';
import type { DetailsRouteParams } from '../../navigation/types';
import { fetchNasaApodItem } from '../../services/api/nasaApodService';
import { fetchSpaceflightNewsItem } from '../../services/api/spaceflightNewsService';
import { getNetworkState } from '../../services/network/networkObserver';

type Result = { status: 'loading' | 'offline' | 'missing' | 'error' } | { status: 'ready'; item: DiscoveryItem };

export function useDiscoveryRecord(params: DetailsRouteParams | null) {
  const source = params?.source;
  const id = params?.id;
  const key = source && id ? source + ':' + id : null;
  const [attempt, setAttempt] = useState(0);
  const [record, setRecord] = useState<{ key: string; result: Result } | null>(null);

  useEffect(() => {
    if (!source || !id || !key) return;
    const abort = new AbortController();
    const report = (result: Result) => {
      if (!abort.signal.aborted) setRecord({ key, result });
    };

    void (async () => {
      try {
        const cached = await getDiscoveryItemById(key);
        if (cached) {
          report({ status: 'ready', item: cached });
          return;
        }
        if ((await getNetworkState()) === 'offline') {
          report({ status: 'offline' });
          return;
        }
        if (abort.signal.aborted) return;
        const fetchItem = source === 'nasa-apod' ? fetchNasaApodItem : fetchSpaceflightNewsItem;
        const item = await fetchItem(id, abort.signal);
        if (abort.signal.aborted) return;
        if (!item) {
          report({ status: 'missing' });
          return;
        }
        await upsertDiscoveryItems([item]);
        report({ status: 'ready', item });
      } catch {
        report({ status: 'error' });
      }
    })();

    return () => abort.abort();
  }, [source, id, key, attempt]);

  const retry = () => {
    setRecord(null);
    setAttempt(value => value + 1);
  };

  return { result: key && key === record?.key ? record.result : { status: 'loading' } as const, retry };
}
