import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';

export function useTabContentInset() {
  const height = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return height + bottom + spacing[2] + spacing[4];
}
