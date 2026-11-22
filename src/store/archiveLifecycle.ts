import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAppDispatch, type AppThunk } from '.';
import { getNetworkState, subscribeToNetworkState, type Connection } from '../services/network/networkObserver';
import { revalidateSessionThunk } from './slices/authSlice';
import { loadCachedFeedThunk, setConnection, syncRemoteFeedThunk } from './slices/feedSlice';
import { loadFavouritesThunk, refreshImagesThunk } from './slices/favouritesSlice';

export const refreshArchive = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  if (getState().feed.cacheStatus !== 'ready') await dispatch(loadCachedFeedThunk());
  if (getState().feed.connection === 'online') {
    await dispatch(syncRemoteFeedThunk());
    void dispatch(refreshImagesThunk());
  }
};

export function useArchiveLifecycle(accountId: number | undefined) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!accountId) return;
    let mounted = true;
    let hydrated = false;
    let connection = 'unknown' as Connection;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      clearTimeout(timer);
      if (connection !== 'online' || !hydrated) return false;
      timer = setTimeout(() => {
        void dispatch(revalidateSessionThunk());
        void dispatch(refreshArchive());
      }, 300);
      return true;
    };

    const updateConnection = (next: Connection) => {
      if (!mounted || next === connection) return;
      connection = next;
      dispatch(setConnection(next));
      schedule();
    };

    const unsubscribe = subscribeToNetworkState(updateConnection);
    const onForeground = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void getNetworkState().then(next => {
        updateConnection(next);
        if (mounted) schedule();
      });
    });

    void (async () => {
      await Promise.all([dispatch(loadCachedFeedThunk()), dispatch(loadFavouritesThunk(accountId))]);
      if (!mounted) return;
      hydrated = true;
      if (connection === 'unknown') {
        void getNetworkState().then(updateConnection);
      }
      if (!schedule()) void dispatch(refreshImagesThunk());
    })();

    return () => {
      mounted = false;
      clearTimeout(timer);
      onForeground.remove();
      unsubscribe();
    };
  }, [accountId, dispatch]);
}
