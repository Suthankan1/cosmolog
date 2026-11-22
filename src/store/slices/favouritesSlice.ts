import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  addFavourite,
  FavouriteDiscoveryItem,
  getFavouriteLocalIds,
  getFavourites,
  removeFavourite,
} from '../../database/repositories/favouritesRepository';
import { updateLocalImageUri } from '../../database/repositories/discoveryRepository';
import { persistImageLocally } from '../../services/storage/imageStorage';
import { DiscoveryItem } from '../../database/models';

export interface FavouritesState {
  favourites: FavouriteDiscoveryItem[];
  favouriteMap: Record<string, boolean>;
  isLoading: boolean;
  recentlyToggledId: string | null;
}

const initialState: FavouritesState = {
  favourites: [],
  favouriteMap: {},
  isLoading: false,
  recentlyToggledId: null,
};

/**
 * Loads favourites from SQLite on app startup.
 */
export const loadFavouritesThunk = createAsyncThunk(
  'favourites/load',
  async () => {
    const [items, ids] = await Promise.all([
      getFavourites(),
      getFavouriteLocalIds(),
    ]);

    const map: Record<string, boolean> = {};
    for (const id of ids) {
      map[id] = true;
    }

    return { items, map };
  }
);

/**
 * Toggles favourite state in SQLite and downloads image locally if newly added.
 */
export const toggleFavouriteThunk = createAsyncThunk(
  'favourites/toggle',
  async (item: DiscoveryItem, { getState }) => {
    const state = (getState() as { favourites: FavouritesState }).favourites;
    const isCurrentlySaved = Boolean(state.favouriteMap[item.localId]);

    if (isCurrentlySaved) {
      await removeFavourite(item.localId);
    } else {
      await addFavourite(item.localId);

      // Download durable offline image file if not yet stored
      if (item.imageRemoteUrl && !item.imageLocalUri) {
        const localUri = await persistImageLocally(item.imageRemoteUrl, item.localId);
        if (localUri) {
          await updateLocalImageUri(item.localId, localUri);
        }
      }
    }

    const [items, ids] = await Promise.all([
      getFavourites(),
      getFavouriteLocalIds(),
    ]);

    const map: Record<string, boolean> = {};
    for (const id of ids) {
      map[id] = true;
    }

    return {
      items,
      map,
      toggledId: item.localId,
    };
  }
);

export const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    clearRecentlyToggled(state) {
      state.recentlyToggledId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFavouritesThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadFavouritesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favourites = action.payload.items;
        state.favouriteMap = action.payload.map;
      })
      .addCase(loadFavouritesThunk.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(toggleFavouriteThunk.fulfilled, (state, action) => {
        state.favourites = action.payload.items;
        state.favouriteMap = action.payload.map;
        state.recentlyToggledId = action.payload.toggledId;
      });
  },
});

export const { clearRecentlyToggled } = favouritesSlice.actions;
export default favouritesSlice.reducer;
