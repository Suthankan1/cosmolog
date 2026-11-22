import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleFavouriteThunk } from '../../store/slices/favouritesSlice';

export function useToggleFavourite() {
  const dispatch = useAppDispatch();
  const favourites = useAppSelector(state => state.favourites.favourites);

  return (localId: string) => {
    if (favourites.some(entry => entry.localId === localId && entry.note)) {
      Alert.alert('Remove saved discovery?', 'This will also remove its field note from your device.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => { void dispatch(toggleFavouriteThunk(localId, true)); } },
      ]);
      return;
    }
    void dispatch(toggleFavouriteThunk(localId));
  };
}
