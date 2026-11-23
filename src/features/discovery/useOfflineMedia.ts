import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getOfflineMedia } from '../../database/repositories/mediaRepository';
import { useAppSelector } from '../../store';

export function useOfflineMedia(accountId: number | undefined, localId: string | undefined) {
  const revision = useAppSelector(state => state.favourites.mediaRevision);
  const key = accountId && localId ? accountId + ':' + localId : undefined;
  const [result, setResult] = useState<{ key: string; revision: number; media: Awaited<ReturnType<typeof getOfflineMedia>> }>();
  useFocusEffect(useCallback(() => {
    if (!accountId || !localId || !key) return;
    let active = true;
    void getOfflineMedia(accountId, localId).then(
      media => { if (active) setResult({ key, revision, media }); },
      () => { if (active) setResult({ key, revision, media: null }); },
    );
    return () => { active = false; };
  }, [accountId, key, localId, revision]));
  return result?.key === key && result?.revision === revision ? result.media : null;
}
