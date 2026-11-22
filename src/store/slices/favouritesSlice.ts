import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk, RootState } from '..';
import {
  FavouriteDiscoveryItem, getFavourites, getLegacyFavouriteCount, importLegacyFavourites, saveFieldNote, setFavourite,
} from '../../database/repositories/favouritesRepository';
import { finishImage, invalidateSavedImage, getPendingImages, reconcileSavedImages } from '../../database/repositories/mediaRepository';
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
              if (!(await finishImage(item.local_id, item.image_remote_url, image, item.image_license_url))) {
                deleteImageFile(image.fileName);
              }
            } catch {
              if (image) deleteImageFile(image.fileName);
              if (getState().feed.connection === 'online') {
                await finishImage(item.local_id, item.image_remote_url, null, item.image_license_url);
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

export const reportImageFailure = (localId: string, uri: string): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const { accountId } = getState().favourites;
  if (!accountId) return;
  try {
    await invalidateSavedImage(localId, uri);
    if (getState().favourites.accountId === accountId) await dispatch(loadFavouritesThunk(accountId));
  } catch {
    dispatch(imageWorkFailed(accountId));
  }
};

export const toggleFavouriteThunk = (localId: string, confirmNoteRemoval = false): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const { accountId, favourites } = getState().favourites;
  if (!accountId) return;
  const bookmark = favourites.find(item => item.localId === localId);
  if (bookmark?.note && !confirmNoteRemoval) return;
  const result = await dispatch(putFavourite({ localId, saved: !bookmark, accountId }));
  if (putFavourite.fulfilled.match(result)) {
    await dispatch(loadFavouritesThunk(accountId));
    dispatch(favouriteOperationFinished({ accountId, localId }));
    void dispatch(refreshImagesThunk());
  }
};

export const saveFieldNoteThunk = (localId: string, text: string | null): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const { accountId, pending } = getState().favourites;
  if (!accountId || pending[localId]) throw new Error('Another bookmark operation is in progress');
  dispatch(fieldNoteStarted(localId));
  try {
    const note = await saveFieldNote(accountId, localId, text);
    dispatch(fieldNoteCommitted({ accountId, localId, note }));
    await dispatch(loadFavouritesThunk(accountId));
  } finally {
    dispatch(favouriteOperationFinished({ accountId, localId }));
  }
};

const slice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    fieldNoteStarted(state, action: PayloadAction<string>) {
      state.pending[action.payload] = true;
    },
    fieldNoteCommitted(state, action: PayloadAction<{ accountId: number; localId: string; note: string | null }>) {
      if (state.accountId !== action.payload.accountId) return;
      const item = state.favourites.find(entry => entry.localId === action.payload.localId);
      if (item) item.note = action.payload.note;
      state.loadRequestId = null;
    },
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

const { favouriteOperationFinished, fieldNoteStarted, fieldNoteCommitted, imageWorkChanged, imageWorkFailed } = slice.actions;
export default slice.reducer;
