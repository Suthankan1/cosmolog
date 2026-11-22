import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { colors, layout } from '../../theme/tokens';
import { Icon } from './Icon';

export interface FavouriteButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  accessibilityLabel?: string;
}

export const FavouriteButton: React.FC<FavouriteButtonProps> = ({
  isSaved,
  onToggle,
  size = 20,
  activeColor = colors.terracotta,
  inactiveColor = colors.muted,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    // Reanimated pulse interaction: scale down then spring overshoot
    scale.value = withSequence(
      withSpring(0.75, { damping: 10, stiffness: 400 }),
      withSpring(1.25, { damping: 8, stiffness: 350 }),
      withSpring(1.0, { damping: 12, stiffness: 300 })
    );

    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const label = accessibilityLabel || (isSaved ? 'Remove from The Field Shelf' : 'Save to The Field Shelf');

  return (
    <Pressable
      onPress={handlePress}
      style={styles.pressable}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSaved }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View style={animatedStyle}>
        <Icon
          name="bookmark"
          size={size}
          color={isSaved ? activeColor : inactiveColor}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    minWidth: layout.minimumTouchTarget,
    minHeight: layout.minimumTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavouriteButton;
