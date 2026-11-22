import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../../theme/tokens';

export interface BrandRevealProps {
  onFinish: () => void;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ onFinish }) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.9);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(8);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
      if (enabled) {
        markOpacity.value = 1;
        markScale.value = 1;
        titleOpacity.value = 1;
        titleTranslateY.value = 0;
        subtitleOpacity.value = 1;
        const timer = setTimeout(() => {
          onFinish();
        }, 300);
        return () => clearTimeout(timer);
      }
    });

    if (!reduceMotion) {
      // 0-250ms: Mark emerges
      markOpacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
      markScale.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.back(1.2)),
      });

      // 250-600ms: Wordmark settles
      titleOpacity.value = withDelay(
        250,
        withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) })
      );
      titleTranslateY.value = withDelay(
        250,
        withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) })
      );

      // 600-950ms: Tagline fades in and completes
      subtitleOpacity.value = withDelay(
        550,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }, (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        })
      );
    }
  }, [reduceMotion, markOpacity, markScale, titleOpacity, titleTranslateY, subtitleOpacity, onFinish]);

  const animatedMarkStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.markWrapper, animatedMarkStyle]}>
        <Image
          source={require('../../../assets/brand/cosmolog-mark.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="COSMOLOG Brand Mark"
        />
      </Animated.View>

      <Animated.View style={animatedTitleStyle}>
        <Text style={styles.brandTitle}>COSMOLOG</Text>
      </Animated.View>

      <Animated.View style={animatedSubtitleStyle}>
        <Text style={styles.brandTagline}>A field journal for the universe</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.forestDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  markWrapper: {
    marginBottom: spacing[4],
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  brandTitle: {
    fontFamily: typography.displayXL.fontFamily,
    fontSize: 36,
    lineHeight: 44,
    color: colors.ivory,
    letterSpacing: 3,
    textAlign: 'center',
  },
  brandTagline: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 15,
    lineHeight: 22,
    color: colors.brass,
    marginTop: spacing[2],
    textAlign: 'center',
  },
});

export default BrandReveal;
