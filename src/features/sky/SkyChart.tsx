import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Icon, type FeatherIconName } from '../../components/common/Icon';
import { colors, layout, radii, typography } from '../../theme/tokens';
import { findSkyObject, type SkyObjectId, type SkyObjectKind } from './catalog';
import { closestMarker, horizontalFieldOfView, project, projectHorizon, type ChartSize, type Point, type ViewDirection } from './projection';
import type { SkyPosition } from './skyMath';

export const objectIcons: Record<SkyObjectKind, FeatherIconName> = {
  star: 'star', 'deep-sky': 'aperture', moon: 'moon', planet: 'circle', satellite: 'radio',
};

interface Props {
  positions: readonly SkyPosition[];
  view: ViewDirection;
  onPan?: (azimuthDelta: number, altitudeDelta: number) => void;
  onSelect: (id: SkyObjectId) => void;
}

const cardinals = [
  { label: 'N', azimuth: 0 }, { label: 'E', azimuth: 90 },
  { label: 'S', azimuth: 180 }, { label: 'W', azimuth: 270 },
];

export const SkyChart = memo(function SkyChart({ positions, view, onPan, onSelect }: Props) {
  const { fontScale } = useWindowDimensions();
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });
  const markers = useMemo(() => positions.flatMap(position => {
    if (size.width === 0) return [];
    const point = project(position, view, size);
    const object = point && findSkyObject(position.id);
    return point && object ? [{ ...point, id: position.id, object }] : [];
  }), [positions, size, view]);
  const gestureState = useRef({ markers, size, onPan, onSelect });
  useLayoutEffect(() => {
    gestureState.current = { markers, size, onPan, onSelect };
  }, [markers, size, onPan, onSelect]);
  const responder = useMemo(() => {
    let origin: Point = { x: 0, y: 0 };
    let previousDrag: Point = { x: 0, y: 0 };
    let dragged = false;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: event => {
        origin = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        previousDrag = { x: 0, y: 0 };
        dragged = false;
      },
      onPanResponderMove: (_event, gesture) => {
        if (Math.hypot(gesture.dx, gesture.dy) > 7) dragged = true;
        if (!dragged) return;
        const current = gestureState.current;
        const degreesPerPoint = horizontalFieldOfView / (current.size.width || 1);
        current.onPan?.((previousDrag.x - gesture.dx) * degreesPerPoint, (gesture.dy - previousDrag.y) * degreesPerPoint);
        previousDrag = { x: gesture.dx, y: gesture.dy };
      },
      onPanResponderRelease: (_event, gesture) => {
        if (dragged || Math.hypot(gesture.dx, gesture.dy) > 7) return;
        const current = gestureState.current;
        const marker = closestMarker(current.markers, origin, layout.minimumTouchTarget);
        if (marker) current.onSelect(marker.id);
      },
    });
  }, []);

  const [start, end] = size.width ? projectHorizon(view, size) : [];
  const horizonLength = start && end ? Math.hypot(end.x - start.x, end.y - start.y) : 0;
  const inset = 4;
  const labelHeight = typography.label.lineHeight * fontScale;
  const labelTop = (y: number, gap: number) => (
    y + gap + labelHeight <= size.height - inset ? y + gap : Math.max(inset, y - gap - labelHeight)
  );
  return (
    <View
      testID="sky-chart"
      style={styles.chart}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
      }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {start && end ? <View style={[styles.horizon, {
          width: horizonLength,
          left: (start.x + end.x - horizonLength) / 2,
          top: (start.y + end.y) / 2,
          transform: [{ rotate: `${Math.atan2(end.y - start.y, end.x - start.x)}rad` }],
        }]} /> : null}
        {size.width > 0 && cardinals.map(({ label, azimuth }) => {
          const point = project({ azimuth, altitude: 0 }, view, size);
          const width = 16 * fontScale;
          return point && <Text key={label} style={[styles.cardinal, {
            width, left: Math.max(inset, Math.min(point.x - width / 2, size.width - width - inset)),
            top: labelTop(point.y, 4),
          }]}>{label}</Text>;
        })}
        <View style={styles.reticle}><Icon name="crosshair" size={22} color={colors.sage} /></View>
        {markers.map(({ id, x, y, object }) => {
          const isStar = object.kind === 'star';
          const labelWidth = Math.min(140 * fontScale, size.width - 2 * inset);
          const labelLeft = Math.max(inset, Math.min(x - 11, size.width - labelWidth - inset));
          return (
            <View key={id} style={[styles.marker, { left: x - 7, top: y - 7, zIndex: isStar ? 0 : 1 }]}>
              {isStar ? <View style={styles.star} /> : (
                <Icon name={objectIcons[object.kind]} size={14} color={colors.brass} />
              )}
              {!isStar && (
                <View style={[styles.annotation, { width: labelWidth, left: labelLeft - x + 7, top: labelTop(y, 8) - y + 7 }]}>
                  <Text numberOfLines={1} style={styles.markerLabel}>
                    {object.kind === 'satellite' ? `${object.name} · Predicted` : object.name}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  chart: {
    aspectRatio: 1.04, maxHeight: 400, overflow: 'hidden', borderRadius: radii.lg,
    backgroundColor: colors.forestDark,
  },
  horizon: { position: 'absolute', height: 1, backgroundColor: colors.sage },
  cardinal: { position: 'absolute', ...typography.label, color: colors.sageLight, textAlign: 'center', includeFontPadding: false },
  reticle: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
  marker: { position: 'absolute', width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  star: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ivory },
  annotation: { position: 'absolute', alignItems: 'flex-start' },
  markerLabel: { ...typography.label, color: colors.ivory, backgroundColor: colors.forestDark, includeFontPadding: false, paddingHorizontal: 2 },
});
