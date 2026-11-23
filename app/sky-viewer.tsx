import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../src/components/common/Header';
import { Icon, type FeatherIconName } from '../src/components/common/Icon';
import { findSkyObject, type SkyObjectId } from '../src/features/sky/catalog';
import { clampAltitude, viewFromAngles, wrapDegrees } from '../src/features/sky/projection';
import { objectIcons, SkyChart } from '../src/features/sky/SkyChart';
import { SkyDetailSheet } from '../src/features/sky/SkyDetailSheet';
import { previewLocation, SkyLocationControls, type SkyLocation } from '../src/features/sky/SkyLocationControls';
import { aboveHorizon, calculateSky, type SkyPosition } from '../src/features/sky/skyMath';
import { useAppSelector } from '../src/store';
import { colors, layout, radii, spacing, typography } from '../src/theme/tokens';

const panControls = [
  { icon: 'arrow-left', label: 'Look left', azimuth: -20, altitude: 0 },
  { icon: 'arrow-up', label: 'Look higher', azimuth: 0, altitude: 15 },
  { icon: 'arrow-down', label: 'Look lower', azimuth: 0, altitude: -15 },
  { icon: 'arrow-right', label: 'Look right', azimuth: 20, altitude: 0 },
] satisfies { icon: FeatherIconName; label: string; azimuth: number; altitude: number }[];

export default function SkyViewerScreen() {
  const offline = useAppSelector(state => state.feed.connection === 'offline');
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [location, setLocation] = useState<SkyLocation>(previewLocation);
  const [now, setNow] = useState(Date.now);
  const [direction, setDirection] = useState({ azimuth: 0, altitude: 30 });
  const [selected, setSelected] = useState<SkyPosition>();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!focused || !foreground) return;
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 10_000);
    return () => clearInterval(timer);
  }, [focused, foreground]);

  const minute = Math.floor(now / 60_000) * 60_000;
  const positions = useMemo(() => aboveHorizon(calculateSky(location, new Date(minute))), [location, minute]);
  const view = useMemo(() => viewFromAngles(direction), [direction]);
  const pan = useCallback((azimuth: number, altitude: number) => {
    setDirection(current => ({
      azimuth: wrapDegrees(current.azimuth + azimuth),
      altitude: clampAltitude(current.altitude + altitude),
    }));
  }, []);

  const select = useCallback((id: SkyObjectId) => {
    setSelected(positions.find(position => position.id === id));
  }, [positions]);

  const locationLabel = location.kind === 'preview' ? 'Colombo preview'
    : `Entered location · ${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`;

  return (
    <View style={styles.screen}>
      <Header title="Sky Viewer" showBack />
      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}
        keyboardShouldPersistTaps="handled"
        data={positions}
        keyExtractor={position => position.id}
        ListHeaderComponent={(
          <View style={styles.intro}>
            {offline && (
              <View style={styles.offline}>
                <Icon name="cloud-off" size={16} color={colors.forest} />
                <Text style={styles.offlineText}>Offline · Sky chart and catalog available</Text>
              </View>
            )}
            <View>
              <Text accessibilityRole="header" style={styles.title}>The sky overhead</Text>
              <Text style={styles.location}>{locationLabel} · {new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
            <SkyChart positions={positions} view={view} onPan={pan} onSelect={select} />
            <View style={styles.panControls}>
              {panControls.map(control => (
                <Pressable key={control.label} accessibilityRole="button" accessibilityLabel={control.label}
                  style={styles.panButton} onPress={() => pan(control.azimuth, control.altitude)}>
                  <Icon name={control.icon} color={colors.forest} />
                </Pressable>
              ))}
            </View>
            <Text style={styles.note}>Drag to explore and tap a marker. Conditions and equipment affect what you can see.</Text>
            <SkyLocationControls onChange={setLocation} />
            <Text accessibilityRole="header" style={styles.section}>Objects above the horizon</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.note}>No catalog objects are above the horizon at this location.</Text>}
        renderItem={({ item }) => {
          const object = findSkyObject(item.id);
          if (!object) return null;
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`${object.name}, ${object.category}, elevation ${Math.round(item.altitude)} degrees`}
              style={styles.objectRow} onPress={() => select(item.id)}>
              <Icon name={objectIcons[object.kind]} color={colors.forest} size={17} />
              <View style={styles.objectText}>
                <Text style={styles.objectName}>{object.name}</Text>
                <Text style={styles.note}>{object.category} · {Math.round(item.altitude)}° up</Text>
              </View>
              <Icon name="chevron-right" color={colors.forest} size={17} />
            </Pressable>
          );
        }}
      />
      {selected && <SkyDetailSheet key={selected.id} id={selected.id} position={selected} offline={offline} onClose={() => setSelected(undefined)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  content: { paddingHorizontal: layout.horizontalInset, paddingTop: spacing[4] },
  intro: { gap: spacing[3], paddingBottom: spacing[2] },
  title: { ...typography.h1, color: colors.forest },
  location: { ...typography.bodySmall, color: colors.muted, marginTop: spacing[1] },
  offline: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.sageLight, borderRadius: radii.md, padding: spacing[3] },
  offlineText: { flex: 1, ...typography.bodySmall, color: colors.forest },
  note: { ...typography.bodySmall, color: colors.muted },
  panControls: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing[2] },
  panButton: {
    width: layout.minimumTouchTarget, height: layout.minimumTouchTarget, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
  },
  section: { ...typography.h2, color: colors.forest, marginTop: spacing[2] },
  objectRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2],
    minHeight: layout.minimumTouchTarget, borderBottomWidth: 1, borderColor: colors.border,
  },
  objectText: { flex: 1 },
  objectName: { ...typography.body, color: colors.forest },
});
