import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Button } from '../../components/common/Button';
import { Icon, type FeatherIconName } from '../../components/common/Icon';
import { colors, layout, radii, spacing, typography } from '../../theme/tokens';
import type { SkyObjectId } from './catalog';
import { clampAltitude, viewFromAngles, wrapDegrees } from './projection';
import { SkyChart } from './SkyChart';
import type { SkyPosition } from './skyMath';
import { useSkyPointing } from './useSkyPointing';

const panControls = [
  { icon: 'arrow-left', label: 'Look left', azimuth: -20, altitude: 0 },
  { icon: 'arrow-up', label: 'Look higher', azimuth: 0, altitude: 15 },
  { icon: 'arrow-down', label: 'Look lower', azimuth: 0, altitude: -15 },
  { icon: 'arrow-right', label: 'Look right', azimuth: 20, altitude: 0 },
] satisfies { icon: FeatherIconName; label: string; azimuth: number; altitude: number }[];

interface Props {
  active: boolean;
  usingDeviceLocation: boolean;
  positions: readonly SkyPosition[];
  onSelect: (id: SkyObjectId) => void;
}

export function SkyViewfinder({ active, usingDeviceLocation, positions, onSelect }: Props) {
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<'auto' | 'manual' | 'point'>('auto');
  const [direction, setDirection] = useState({ azimuth: 0, altitude: 30 });
  const wantsPointing = mode === 'point' || (mode === 'auto' && !reducedMotion);
  const pointing = useSkyPointing(active && usingDeviceLocation && wantsPointing, reducedMotion);
  const manualView = useMemo(() => viewFromAngles(direction), [direction]);
  const isPointing = pointing.status === 'ready';
  const pan = useCallback((azimuth: number, altitude: number) => {
    setDirection(current => ({
      azimuth: wrapDegrees(current.azimuth + azimuth),
      altitude: clampAltitude(current.altitude + altitude),
    }));
  }, []);

  return (
    <View style={styles.controls}>
      <SkyChart positions={positions} view={isPointing ? pointing.view : manualView}
        onPan={isPointing ? undefined : pan} onSelect={onSelect} />
      {!isPointing && <View style={styles.arrows}>
        {panControls.map(control => (
          <Pressable key={control.label} accessibilityRole="button" accessibilityLabel={control.label}
            style={styles.panButton} onPress={() => pan(control.azimuth, control.altitude)}>
            <Icon name={control.icon} color={colors.forest} />
          </Pressable>
        ))}
      </View>}
      <Text style={styles.note}>
        {isPointing ? 'Hold the back of your phone toward the sky and tap a marker.' : 'Drag to explore and tap a marker.'}
        {' '}Conditions and equipment affect what you can see.
      </Text>
      {usingDeviceLocation && (
        <>
          {wantsPointing && !isPointing && (
            <Text style={styles.note}>
              {pointing.status === 'unavailable'
                ? 'Phone pointing is unavailable. Use the chart controls to explore.'
                : 'Waiting for a reliable compass. Move your phone slowly away from metal, or use the chart controls.'}
            </Text>
          )}
          <Button title={wantsPointing ? 'Use manual controls' : 'Point phone'}
            icon={wantsPointing ? 'move' : 'compass'} variant="outline"
            onPress={() => setMode(wantsPointing ? 'manual' : 'point')} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { gap: spacing[3] },
  arrows: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing[2] },
  panButton: {
    width: layout.minimumTouchTarget, height: layout.minimumTouchTarget, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
  },
  note: { ...typography.bodySmall, color: colors.muted },
});
