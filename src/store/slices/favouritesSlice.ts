import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk, RootState } from '..';
import {
  FavouriteDiscoveryItem, getFavourites, getLegacyFavouriteCount, importLegacyFavourites, setFavourite,
} from '../../database/repositories/favouritesRepository';
import { finishImage, getPendingImages, reconcileSavedImages } from '../../database/repositories/mediaRepository';
import { deleteImageFile, downloadImage, pruneImageFiles } from '../../services/storage/imageStorage';
import { sessionChanged } from './authSlice';

export interface FavouritesState {
  accountId: number | null;
  loadRequestId: string | null;
  favourites: FavouriteDiscoveryItem[];
  pending: Record<string, boolean>;
  legacyCount: number;
  isLoading: boolean;
  isDownloading: boolean;
  error: string | null;
}

const initialState: FavouritesState = {
  accountId: null, loadRequestId: null, favourites: [], pending: {}, legacyCount: 0,
  isLoading: false, isDownloading: false, error: null,
};

export const loadFavouritesThunk = createAsyncThunk(
  'favourites/load',
  async (accountId: number) => {
    const [favourites, legacyCount] = await Promise.all([getFavourites(accountId), getLegacyFavouriteCount()]);
    return { favourites, legacyCount };
  },
);

const putFavourite = createAsyncThunk(
  'favourites/set',
  async ({ localId, saved, accountId }: { localId: string; saved: boolean; accountId: number }) => {
    await setFavourite(accountId, localId, saved);
  },
  {
    condition: ({ localId, accountId }, { getState }) => {
      const { favourites } = getState() as RootState;
      return favourites.accountId === accountId && !favourites.pending[localId];
    },
  },
);

export const importFavouritesThunk = createAsyncThunk('favourites/import', async (accountId: number) => {
  await importLegacyFavourites(accountId);
});

let mediaWork: Promise<void> | undefined;
let mediaQueued = false;

export const refreshImagesThunk = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  mediaQueued = true;
  if (mediaWork) return mediaWork;

  mediaWork = (async () => {
    while (mediaQueued) {
      mediaQueued = false;
      const accountId = getState().favourites.accountId;
      if (!accountId) continue;
      dispatch(imageWorkChanged({ accountId, busy: true }));
      try {
        pruneImageFiles(await reconcileSavedImages());
        if (getState().feed.connection === 'online') {
          for (const item of await getPendingImages(accountId)) {
            const state = getState();
            if (state.favourites.accountId !== accountId || state.feed.connection !== 'online') break;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15_000);
            let image: Awaited<ReturnType<typeof downloadImage>> | null = null;
            try {
              image = await downloadImage(item.image_remote_url, item.local_id, controller.signal);
              if (!(await finishImage(item.local_id, item.image_remote_url, image))) {
                deleteImageFile(image.fileName);
              }
            } catch {
              if (image) deleteImageFile(image.fileName);
              if (getState().feed.connection === 'online') {
                await finishImage(item.local_id, item.image_remote_url, null);
              }
            } finally {
              clearTimeout(timeout);
            }
            if (getState().favourites.accountId === accountId) await dispatch(loadFavouritesThunk(accountId));
          }
        }
      } catch {
        dispatch(imageWorkFailed(accountId));
      } finally {
        if (getState().favourites.accountId === accountId) await dispatch(loadFavouritesThunk(accountId));
        dispatch(imageWorkChanged({ accountId, busy: false }));
      }
    }
  })().finally(() => { mediaWork = undefined; });

  return mediaWork;
};

export const toggleFavouriteThunk = (localId: string): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const { accountId, favourites } = getState().favourites;
  if (!accountId) return;
  const saved = favourites.some(item => item.localId === localId);
  const result = await dispatch(putFavourite({ localId, saved: !saved, accountId }));
  if (putFavourite.fulfilled.match(result)) {
    await dispatch(loadFavouritesThunk(accountId));
    dispatch(favouriteOperationFinished({ accountId, localId }));
    void dispatch(refreshImagesThunk());
  }
};

const slice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    favouriteOperationFinished(state, action: PayloadAction<{ accountId: number; localId: string }>) {
      if (state.accountId === action.payload.accountId) delete state.pending[action.payload.localId];
    },
    imageWorkChanged(state, action: PayloadAction<{ accountId: number; busy: boolean }>) {
      if (state.accountId === action.payload.accountId) state.isDownloading = action.payload.busy;
    },
    imageWorkFailed(state, action: PayloadAction<number>) {
      if (state.accountId === action.payload) state.error = 'Could not update offline images.';
    },
  },
  extraReducers: builder => builder
    .addCase(sessionChanged, (state, action) => {
      const accountId = action.payload?.id ?? null;
      if (state.accountId !== accountId) return { ...initialState, accountId, isLoading: Boolean(accountId) };
    })
    .addCase(loadFavouritesThunk.pending, (state, action) => {
      if (state.accountId !== action.meta.arg) return;
      state.loadRequestId = action.meta.requestId;
      if (!state.favourites.length) state.isLoading = true;
    })
    .addCase(loadFavouritesThunk.fulfilled, (state, action) => {
      if (state.loadRequestId !== action.meta.requestId) return;
      Object.assign(state, action.payload, { isLoading: false, loadRequestId: null });
    })
    .addCase(loadFavouritesThunk.rejected, (state, action) => {
      if (state.loadRequestId !== action.meta.requestId) return;
      state.isLoading = false;
      state.loadRequestId = null;
      state.error = 'Could not read your saved discoveries.';
    })
    .addCase(putFavourite.pending, (state, action) => {
      state.pending[action.meta.arg.localId] = true;
      state.error = null;
    })
    .addCase(putFavourite.rejected, (state, action) => {
      if (state.accountId !== action.meta.arg.accountId) return;
      delete state.pending[action.meta.arg.localId];
      state.error = 'Could not update your bookmark. Try again.';
    })
    .addCase(importFavouritesThunk.fulfilled, (state, action) => {
      if (state.accountId !== action.meta.arg) return;
      state.legacyCount = 0;
      state.error = null;
    })
    .addCase(importFavouritesThunk.rejected, (state, action) => {
      if (state.accountId === action.meta.arg) state.error = 'Could not import your earlier bookmarks.';
    }),
});

const { favouriteOperationFinished, imageWorkChanged, imageWorkFailed } = slice.actions;
export default slice.reducer;
