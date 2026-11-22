import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DiscoveryItem } from '../../database/models';
import { getCachedFeed, upsertDiscoveryItems } from '../../database/repositories/discoveryRepository';
import { getLastSuccessfulSync, recordSyncAttempt, setLastSuccessfulSync } from '../../database/repositories/syncMetadataRepository';
import { fetchNasaApodFeed } from '../../services/api/nasaApodService';
import { fetchSpaceflightNewsFeed } from '../../services/api/spaceflightNewsService';
import { getNetworkState } from '../../services/network/networkObserver';
import { DiscoverySource } from '../../navigation/types';

export const DISCOVERY_FEED_KEY = 'discovery_feed';

export interface FeedState {
  items: DiscoveryItem[];
  dailyPlate: DiscoveryItem | null;
  dispatches: DiscoveryItem[];
  selectedCategory: 'all' | DiscoverySource;
  searchQuery: string;
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

const initialState: FeedState = {
  items: [],
  dailyPlate: null,
  dispatches: [],
  selectedCategory: 'all',
  searchQuery: '',
  isLoading: false,
  isRefreshing: false,
  isOffline: false,
  lastSyncedAt: null,
  error: null,
};

function splitFeedItems(items: DiscoveryItem[]): {
  dailyPlate: DiscoveryItem | null;
  dispatches: DiscoveryItem[];
} {
  const apod = items.find((i) => i.source === 'nasa-apod') || null;
  const dispatches = items.filter((i) => i.source === 'spaceflight-news');
  return { dailyPlate: apod, dispatches };
}

/**
 * Reads directly from durable SQLite cache on startup.
 * Never waits for remote network request before rendering cached discoveries.
 */
export const loadCachedFeedThunk = createAsyncThunk(
  'feed/loadCached',
  async () => {
    const cachedItems = await getCachedFeed();
    const lastSync = await getLastSuccessfulSync(DISCOVERY_FEED_KEY);
    const isOnline = await getNetworkState();

    return {
      items: cachedItems,
      lastSyncedAt: lastSync,
      isOffline: !isOnline,
    };
  }
);

/**
 * Synchronizes remote feeds when online and persists validated data to SQLite.
 */
export const syncRemoteFeedThunk = createAsyncThunk(
  'feed/syncRemote',
  async (_, { rejectWithValue }) => {
    const isOnline = await getNetworkState();
    if (!isOnline) {
      await recordSyncAttempt(DISCOVERY_FEED_KEY, 'OFFLINE');
      return { offline: true };
    }

    try {
      // Fetch both curated sources concurrently
      const [apodItems, newsItems] = await Promise.all([
        fetchNasaApodFeed(8).catch(() => []),
        fetchSpaceflightNewsFeed(15).catch(() => []),
      ]);

      const combined = [...apodItems, ...newsItems];
      if (combined.length === 0) {
        throw new Error('No articles returned from discovery APIs.');
      }

      // Transactionally upsert validated records into SQLite
      await upsertDiscoveryItems(combined);

      // Record truthful sync timestamp strictly after commit
      const syncTimestamp = new Date().toISOString();
      await setLastSuccessfulSync(DISCOVERY_FEED_KEY, syncTimestamp);

      // Reload consolidated state from SQLite
      const updatedFeed = await getCachedFeed();

      return {
        items: updatedFeed,
        lastSyncedAt: syncTimestamp,
        offline: false,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Feed refresh failed';
      await recordSyncAttempt(DISCOVERY_FEED_KEY, message);
      return rejectWithValue(message);
    }
  }
);

export const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<'all' | DiscoverySource>) {
      state.selectedCategory = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setIsOffline(state, action: PayloadAction<boolean>) {
      state.isOffline = action.payload;
    },
    clearFeedError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initial SQLite load
    builder
      .addCase(loadCachedFeedThunk.pending, (state) => {
        state.isLoading = state.items.length === 0;
      })
      .addCase(loadCachedFeedThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.lastSyncedAt = action.payload.lastSyncedAt;
        state.isOffline = action.payload.isOffline;
        const { dailyPlate, dispatches } = splitFeedItems(action.payload.items);
        state.dailyPlate = dailyPlate;
        state.dispatches = dispatches;
      })
      .addCase(loadCachedFeedThunk.rejected, (state) => {
        state.isLoading = false;
      });

    // Remote sync
    builder
      .addCase(syncRemoteFeedThunk.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(syncRemoteFeedThunk.fulfilled, (state, action) => {
        state.isRefreshing = false;
        if (action.payload.offline) {
          state.isOffline = true;
        } else if (action.payload.items) {
          state.isOffline = false;
          state.items = action.payload.items;
          state.lastSyncedAt = action.payload.lastSyncedAt;
          const { dailyPlate, dispatches } = splitFeedItems(action.payload.items);
          state.dailyPlate = dailyPlate;
          state.dispatches = dispatches;
          state.error = null;
        }
      })
      .addCase(syncRemoteFeedThunk.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = (action.payload as string) || 'Unable to update dispatches';
      });
  },
});

export const { setSelectedCategory, setSearchQuery, setIsOffline, clearFeedError } = feedSlice.actions;
export default feedSlice.reducer;
