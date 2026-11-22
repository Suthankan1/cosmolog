import { configureStore, type UnknownAction, type ThunkAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import favouritesReducer from './slices/favouritesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    favourites: favouritesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<Result> = ThunkAction<Result, RootState, undefined, UnknownAction>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
