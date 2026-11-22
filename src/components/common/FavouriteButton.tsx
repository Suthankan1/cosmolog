import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { colors, layout, radii } from '../../theme/tokens';
import { Icon } from './Icon';

export interface FavouriteButtonProps {
  isSaved: boolean;
  pending?: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  accessibilityLabel?: string;
}

export function FavouriteButton({
  isSaved, pending = false, onToggle, size = 20, activeColor = colors.forest,
  inactiveColor = colors.muted, accessibilityLabel,
}: FavouriteButtonProps) {
  const scale = useSharedValue(1);
  const previous = useRef(isSaved);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (isSaved && !previous.current && !reducedMotion) {
      scale.value = withSequence(withSpring(1.2), withSpring(1));
    }
    previous.current = isSaved;
  }, [isSaved, reducedMotion, scale]);

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.pressable, isSaved && styles.selected]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isSaved ? 'Remove from The Field Shelf' : 'Save to The Field Shelf')}
      disabled={pending}
      accessibilityState={{ selected: isSaved, busy: pending, disabled: pending }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon name={isSaved ? 'check' : 'bookmark'} size={size} color={isSaved ? activeColor : inactiveColor} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: layout.minimumTouchTarget,
    height: layout.minimumTouchTarget,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: { backgroundColor: colors.sageLight },
});
