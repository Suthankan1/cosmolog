import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useReducedMotion,
  useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, typography } from '../../theme/tokens';
import { Earthrise } from './Earthrise';

export const revealDuration = 5000;

export function BrandReveal({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const finished = useRef(false);
  const time = useSharedValue(reduced ? revealDuration : 0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wordWidth = Math.min(width - 48, 460);
  const cap = wordWidth * 100 / 717;
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    if (reduced) { finish(); return; }
    time.value = withTiming(revealDuration, { duration: revealDuration, easing: Easing.linear });
    const timer = setTimeout(finish, revealDuration);
    return () => { clearTimeout(timer); cancelAnimation(time); };
  }, [finish, reduced, time]);

  const monogram = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(time.value, [1800, 3100], [0, (cap - wordWidth) / 2], 'clamp') },
      { scale: interpolate(time.value, [1800, 3100], [1, cap / 128], 'clamp') },
    ],
  }));
  const upper = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(time.value, [600, 1200, 1800], [0, 7, 0], 'clamp') },
      { translateY: interpolate(time.value, [600, 1200, 1800], [0, -5, 0], 'clamp') }],
  }));
  const letters = useAnimatedStyle(() => ({
    width: interpolate(time.value, [1900, 3100], [0, wordWidth - cap * .9], 'clamp'),
  }));
  const photo = useAnimatedStyle(() => ({
    height: interpolate(time.value, [3100, 4300], [0, 115], 'clamp'),
  }));
  return (
    <View style={styles.screen} accessibilityViewIsModal>
      <Animated.View style={[styles.mark, monogram]} accessible accessibilityLabel="Opening COSMOLOG">
        <Image source={require('../../../assets/brand/c-lower.svg')} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, upper]}>
          <Image source={require('../../../assets/brand/c-upper.svg')} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.mask, { left: (width - wordWidth) / 2 + cap * .9, height: cap * 1.02 }, letters]}>
        <Image source={require('../../../assets/brand/wordmark-tail.svg')} style={{ width: wordWidth - cap * .9, height: cap * 1.02 }} />
      </Animated.View>
      <Animated.View style={[styles.photo, { bottom: insets.bottom + 32 }, photo]}>
        <Earthrise style={styles.crop} />
      </Animated.View>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" onPress={finish}
        style={[styles.skip, { top: insets.top + 8 }]}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forestDark },
  mark: { width: 128, height: 128 },
  mask: { position: 'absolute', overflow: 'hidden', justifyContent: 'center' },
  photo: { position: 'absolute', left: 24, right: 24, overflow: 'hidden' },
  crop: { height: 115, width: '100%' },
  skip: { position: 'absolute', right: 16, minWidth: layout.minimumTouchTarget, minHeight: layout.minimumTouchTarget,
    alignItems: 'center', justifyContent: 'center' },
  skipText: { ...typography.label, color: colors.ivory },
});
