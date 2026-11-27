import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { colors, radii } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

/** Decorative backdrop. The owner provides layout, elevation and interactive children. */
export function FloatingSurface() {
  const { isNight, colors: themeColors } = useTheme();
  const available = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    if (!available) return;
    let acceptInitial = true;
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', value => {
      acceptInitial = false;
      setReduced(value);
    });
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => {
      if (acceptInitial) setReduced(value);
    }, () => {});
    return () => { acceptInitial = false; subscription.remove(); };
  }, [available]);

  return available && !reduced
    ? <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme={isNight ? 'dark' : 'light'} style={styles.glass} />
    : <View pointerEvents="none" style={[styles.solid, isNight && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} />;
}

const styles = StyleSheet.create({
  glass: { ...StyleSheet.absoluteFill, borderRadius: radii.pill },
  solid: { ...StyleSheet.absoluteFill, borderRadius: radii.pill, backgroundColor: colors.surface,
    borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
});
