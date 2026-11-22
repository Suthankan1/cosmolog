import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { cancelAnimation, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors, spacing, typography } from '../../theme/tokens';
import { Earthrise } from './Earthrise';

export function BrandReveal({ onFinish }: { onFinish: () => void }) {
  const reducedMotion = useReducedMotion();
  const mark = useSharedValue(reducedMotion ? 1 : 0);
  const wordmark = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (!reducedMotion) {
      mark.value = withTiming(1, { duration: 320 });
      wordmark.value = withDelay(220, withTiming(1, { duration: 420 }));
    }
    const timer = setTimeout(onFinish, reducedMotion ? 0 : 760);
    return () => {
      clearTimeout(timer);
      cancelAnimation(mark);
      cancelAnimation(wordmark);
    };
  }, [mark, onFinish, reducedMotion, wordmark]);

  return (
    <View style={styles.screen} accessibilityRole="progressbar" accessibilityLabel="Opening COSMOLOG">
      <Earthrise style={styles.photo} />
      <View style={styles.identity}>
        <Animated.View style={{ opacity: mark }}>
          <Image source={require('../../../assets/brand/cosmolog-mark-ivory.svg')} style={styles.mark} contentFit="contain" />
        </Animated.View>
        <Animated.View style={{ opacity: wordmark }}>
          <Text style={styles.name}>COSMOLOG</Text>
          <Text style={styles.tagline}>A field journal for the universe</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, zIndex: 1, backgroundColor: colors.forestDark },
  photo: { position: 'absolute', bottom: 0, width: '100%', height: '39%' },
  identity: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: '38%', paddingHorizontal: spacing[4] },
  mark: { width: 120, height: 120, marginBottom: spacing[4] },
  name: { ...typography.displayXL, color: colors.ivory, letterSpacing: 2, textAlign: 'center' },
  tagline: { fontFamily: 'PlayfairDisplay-Italic', fontSize: 16, color: colors.ivory, textAlign: 'center' },
});
