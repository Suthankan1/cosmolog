import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import { DiscoveryItem } from '../../database/models';
import { commitFeedSnapshot, getCachedFeed } from '../../database/repositories/discoveryRepository';
import {
  getSyncMetadata, LEGACY_FEED_KEY, recordSyncFailure, SyncMetadata,
} from '../../database/repositories/syncMetadataRepository';
import { fetchNasaApodFeed } from '../../services/api/nasaApodService';
import { fetchSpaceflightNewsFeed } from '../../services/api/spaceflightNewsService';
import { Connection } from '../../services/network/networkObserver';
import { DiscoverySource } from '../../navigation/types';
import { sessionChanged } from './authSlice';

const sources = [
  ['nasa-apod', fetchNasaApodFeed],
  ['spaceflight-news', fetchSpaceflightNewsFeed],
] as const;

async function readFeed() {
  const [items, nasa, news, legacy] = await Promise.all([
    getCachedFeed(), getSyncMetadata('nasa-apod'), getSyncMetadata('spaceflight-news'),
    getSyncMetadata(LEGACY_FEED_KEY),
  ]);
  return { items, metadata: { 'nasa-apod': nasa, 'spaceflight-news': news }, legacySyncedAt: legacy.lastSyncedAt };
}

export const loadCachedFeedThunk = createAsyncThunk('feed/loadCached', readFeed, {
  condition: (_, { getState }) => (getState() as RootState).feed.cacheStatus !== 'loading',
});

export const syncRemoteFeedThunk = createAsyncThunk(
  'feed/syncRemote',
  async (_, { signal }) => {
    const errors: Partial<Record<DiscoverySource, string>> = {};
    await Promise.all(sources.map(async ([source, fetchFeed]) => {
      try {
        const items = await fetchFeed(signal);
        if (!signal.aborted) await commitFeedSnapshot(source, items, new Date().toISOString());
      } catch {
        if (signal.aborted) return;
        const message = 'Could not refresh this source.';
        errors[source] = message;
        await recordSyncFailure(source, message).catch(() => {});
      }
    }));
    const result = await readFeed();
    for (const source of Object.keys(errors) as DiscoverySource[]) {
      result.metadata[source] = { ...result.metadata[source], error: errors[source]! };
    }
    return result;
  },
  {
    condition: (_, { getState }) => {
      const { feed, auth } = getState() as RootState;
      return auth.isAuthenticated && feed.connection === 'online' && feed.cacheStatus === 'ready' && !feed.isRefreshing;
    },
  },
);

type Category = 'all' | DiscoverySource;

export interface FeedState {
  items: DiscoveryItem[];
  metadata: Record<DiscoverySource, SyncMetadata>;
  legacySyncedAt: string | null;
  selectedCategory: Category;
  searchQuery: string;
  cacheStatus: 'idle' | 'loading' | 'ready' | 'error';
  connection: Connection;
  isRefreshing: boolean;
  refreshError: boolean;
}

const initialState: FeedState = {
  items: [],
  metadata: {
    'nasa-apod': { lastSyncedAt: null, lastAttemptAt: null, error: null },
    'spaceflight-news': { lastSyncedAt: null, lastAttemptAt: null, error: null },
  },
  legacySyncedAt: null,
  selectedCategory: 'all',
  searchQuery: '',
  cacheStatus: 'idle',
  connection: 'unknown',
  isRefreshing: false,
  refreshError: false,
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<Category>) { state.selectedCategory = action.payload; },
    setSearchQuery(state, action: PayloadAction<string>) { state.searchQuery = action.payload; },
    setConnection(state, action: PayloadAction<Connection>) { state.connection = action.payload; },
  },
  extraReducers: builder => builder
    .addCase(sessionChanged, (state, action) => {
      if (action.payload) return;
      state.selectedCategory = 'all';
      state.searchQuery = '';
      state.connection = 'unknown';
    })
    .addCase(loadCachedFeedThunk.pending, state => { state.cacheStatus = 'loading'; })
    .addCase(loadCachedFeedThunk.fulfilled, (state, action) => {
      Object.assign(state, action.payload, { cacheStatus: 'ready' });
    })
    .addCase(loadCachedFeedThunk.rejected, state => { state.cacheStatus = 'error'; })
    .addCase(syncRemoteFeedThunk.pending, state => {
      state.isRefreshing = true;
      state.refreshError = false;
    })
    .addCase(syncRemoteFeedThunk.fulfilled, (state, action) => {
      Object.assign(state, action.payload, { isRefreshing: false });
    })
    .addCase(syncRemoteFeedThunk.rejected, (state, action) => {
      state.isRefreshing = false;
      state.refreshError = !action.meta.aborted;
    }),
});

export const { setSelectedCategory, setSearchQuery, setConnection } = feedSlice.actions;
export default feedSlice.reducer;
