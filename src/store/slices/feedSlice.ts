import { commitDispatchPage, readDispatchWindow } from '../../database/repositories/dispatchPages';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import { DiscoveryItem } from '../../database/models';
import { commitFeedSnapshot, getCachedFeed } from '../../database/repositories/discoveryRepository';
import {
  getSyncMetadata, LEGACY_FEED_KEY, recordSyncFailure, SyncMetadata,
} from '../../database/repositories/syncMetadataRepository';
import { fetchNasaApodFeed } from '../../services/api/nasaApodService';
import { fetchNewsPage } from '../../services/api/spaceflightNewsService';
import { Connection } from '../../services/network/networkObserver';
import { DiscoverySource } from '../../navigation/types';
import { sessionChanged } from './authSlice';

const sources = ['nasa-apod', 'spaceflight-news'] as const;
type FeedSource = typeof sources[number];

async function readFeed(limit = 15) {
  const [plates, window, nasa, news, legacy] = await Promise.all([
    getCachedFeed('nasa-apod'), readDispatchWindow(limit), getSyncMetadata('nasa-apod'),
    getSyncMetadata('spaceflight-news'), getSyncMetadata(LEGACY_FEED_KEY),
  ]);
  return { items: [...plates, ...window.articles], limit, moreCached: window.moreCached,
    cursor: window.cursor, metadata: { 'nasa-apod': nasa, 'spaceflight-news': news }, legacySyncedAt: legacy.lastSyncedAt };
}

export const loadCachedFeedThunk = createAsyncThunk('feed/loadCached', async () => readFeed(), {
  condition: (_, { getState }) => (getState() as RootState).feed.cacheStatus !== 'loading',
});

export const syncRemoteFeedThunk = createAsyncThunk(
  'feed/syncRemote',
  async (_, { signal, getState }) => {
    const errors: Partial<Record<FeedSource, string>> = {};
    await Promise.all(sources.map(async source => {
      try {
        if (source === 'spaceflight-news') {
          const page = await fetchNewsPage(0, null, undefined, signal);
          if (!signal.aborted) await commitDispatchPage(page, new Date().toISOString());
        } else {
          const items = await fetchNasaApodFeed(signal);
          if (!signal.aborted) await commitFeedSnapshot(source, items, new Date().toISOString());
        }
      } catch {
        if (signal.aborted) return;
        const message = 'Could not refresh this source.';
        errors[source] = message;
        await recordSyncFailure(source, message).catch(() => {});
      }
    }));
    const result = await readFeed((getState() as RootState).feed.limit);
    for (const source of Object.keys(errors) as FeedSource[]) {
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

export const loadOlder = createAsyncThunk('feed/older', async (_, { getState, signal }) => {
  const { cursor, limit, moreCached } = (getState() as RootState).feed;
  if (!moreCached && cursor?.next_offset != null) {
    const page = await fetchNewsPage(cursor.next_offset, cursor.anchor, undefined, signal);
    if (!signal.aborted) await commitDispatchPage(page, cursor.generation, cursor);
  }
  return readFeed(limit + 15);
}, { condition: (_, { getState }) => {
  const { feed, auth } = getState() as RootState;
  return auth.isAuthenticated && feed.cacheStatus === 'ready' && !feed.isRefreshing && !feed.appending &&
    (feed.moreCached || (feed.connection === 'online' && feed.cursor?.next_offset != null));
} });

type Category = 'all' | DiscoverySource;

export interface FeedState {
  limit: number;
  cursor: Awaited<ReturnType<typeof readDispatchWindow>>['cursor'];
  moreCached: boolean;
  appending: boolean;
  appendError: boolean;
  items: DiscoveryItem[];
  metadata: Record<FeedSource, SyncMetadata>;
  legacySyncedAt: string | null;
  selectedCategory: Category;
  searchQuery: string;
  cacheStatus: 'idle' | 'loading' | 'ready' | 'error';
  connection: Connection;
  isRefreshing: boolean;
  refreshError: boolean;
}

const initialState: FeedState = {
  limit: 15, cursor: null, moreCached: false, appending: false, appendError: false,
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
    .addCase(loadOlder.pending, state => { state.appending = true; state.appendError = false; })
    .addCase(loadOlder.rejected, state => { state.appending = false; state.appendError = true; })
    .addCase(loadOlder.fulfilled, (state, action) => {
      state.appending = false;
      if (!state.isRefreshing && state.cursor?.generation === action.payload.cursor?.generation)
        Object.assign(state, action.payload);
    })
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
