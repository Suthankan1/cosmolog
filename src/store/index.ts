import { configureStore, type UnknownAction, type ThunkAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer, { type AuthState } from './slices/authSlice';
import feedReducer, { type FeedState } from './slices/feedSlice';
import favouritesReducer, { type FavouritesState } from './slices/favouritesSlice';

export const store = configureStore({
  // Field notes are private. Avoid exposing state and action snapshots to DevTools.
  devTools: false,
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    favourites: favouritesReducer,
  },
});

export interface RootState {
  auth: AuthState;
  feed: FeedState;
  favourites: FavouritesState;
}
export type AppThunk<Result> = ThunkAction<Result, RootState, undefined, UnknownAction>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
