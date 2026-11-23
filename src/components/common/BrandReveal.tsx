import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useReducedMotion,
  useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, typography } from '../../theme/tokens';

type Props = {
  dismissNative: () => Promise<void>;
  destinationReady: boolean;
  onFinish: () => void;
};

function easeOut(time: number, start: number, end: number) {
  'worklet';
  const fraction = interpolate(time, [start, end], [0, 1], 'clamp');
  return 1 - (1 - fraction) ** 2;
}

export function BrandReveal({ dismissNative, destinationReady, onFinish }: Props) {
  const reduced = useReducedMotion();
  const [laidOut, setLaidOut] = useState(false);
  const [markReady, setMarkReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [settled, setSettled] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [globeFailed, setGlobeFailed] = useState(false);
  const bypass = skipped || reduced;
  const mounted = useRef(true);
  const finished = useRef(false);
  const clock = useSharedValue(0);
  const opacity = useSharedValue(1);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const globe = Math.min(width * 0.3, 128);
  const word = Math.min(width - 48, 360);

  const finish = useCallback(() => {
    if (!mounted.current || finished.current) return;
    finished.current = true;
    onFinish();
  }, [onFinish]);
  const settle = useCallback(() => {
    if (mounted.current) setSettled(true);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!laidOut || !markReady) return;
    let active = true;
    void dismissNative().finally(() => { if (active) setStarted(true); });
    return () => { active = false; };
  }, [dismissNative, laidOut, markReady]);

  useEffect(() => {
    if (!started || bypass) return;
    clock.value = withTiming(820, { duration: 820, easing: Easing.linear }, done => {
      if (done) scheduleOnRN(settle);
    });
    return () => cancelAnimation(clock);
  }, [started, bypass, clock, settle]);

  useEffect(() => {
    if (!started || !destinationReady) return;
    if (bypass) { finish(); return; }
    if (!settled) return;
    opacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) }, done => {
      if (done) scheduleOnRN(finish);
    });
    return () => cancelAnimation(opacity);
  }, [started, destinationReady, settled, bypass, opacity, finish]);

  const overlay = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const mark = useAnimatedStyle(() => ({ opacity: 1 - easeOut(clock.value, 0, 360) }));
  const earth = useAnimatedStyle(() => {
    const p = easeOut(clock.value, 0, 360);
    return { opacity: p, transform: [{ translateY: (1 - p) * 6 }] };
  });
  const masthead = useAnimatedStyle(() => {
    const p = easeOut(clock.value, 160, 650);
    return { opacity: p, transform: [{ translateY: (1 - p) * 4 }] };
  });
  return (
    <Animated.View testID="launch-overlay" style={[styles.screen, overlay]} accessibilityViewIsModal onLayout={() => setLaidOut(true)}>
      <Animated.View style={[styles.mark, !bypass && mark]}>
        <Image testID="launch-mark" source={require('../../../assets/brand/cosmolog-mark-ivory.png')} style={StyleSheet.absoluteFill}
          onDisplay={() => setMarkReady(true)} onError={() => setMarkReady(true)} accessible={false} />
      </Animated.View>
      {!bypass && <View style={[styles.composition, { top: insets.top, bottom: insets.bottom }]} pointerEvents="none">
        {!globeFailed && <Animated.View style={[{ width: globe, height: globe }, earth]}>
          <Image testID="launch-earth" source={require('../../../assets/editorial/blue-marble.png')} style={StyleSheet.absoluteFill}
            accessible={false} onError={() => setGlobeFailed(true)} />
        </Animated.View>}
        <Animated.View style={[{ width: word, height: word * 102 / 717 }, masthead]}>
          <Image source={require('../../../assets/brand/cosmolog-lockup-ivory.svg')} style={StyleSheet.absoluteFill}
            contentFit="contain" accessible={false} />
        </Animated.View>
      </View>}
      {!bypass && <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction"
        onPress={() => setSkipped(true)} style={[styles.skip, { top: insets.top + 8 }]}>
        <Text style={styles.label}>Skip</Text>
      </Pressable>}
      {(settled || bypass) && !destinationReady && <Text accessibilityRole="alert"
        style={[styles.status, styles.label, { bottom: insets.bottom + 24 }]}>Restoring your session</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forestDark },
  mark: { width: 128, height: 128 },
  composition: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', gap: 16 },
  skip: { position: 'absolute', right: 16, minWidth: layout.minimumTouchTarget, minHeight: layout.minimumTouchTarget,
    alignItems: 'center', justifyContent: 'center' },
  status: { position: 'absolute', textAlign: 'center' },
  label: { ...typography.label, color: colors.ivory },
});
