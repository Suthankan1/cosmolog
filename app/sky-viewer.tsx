import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../src/components/common/Header';
import { Icon } from '../src/components/common/Icon';
import { findSkyObject, type SkyObjectId } from '../src/features/sky/catalog';
import { objectIcons } from '../src/features/sky/SkyChart';
import { SkyDetailSheet } from '../src/features/sky/SkyDetailSheet';
import { SkyLocationControls } from '../src/features/sky/SkyLocationControls';
import { SkyViewfinder } from '../src/features/sky/SkyViewfinder';
import { aboveHorizon, calculateSky, type SkyPosition } from '../src/features/sky/skyMath';
import { useSkyLocation } from '../src/features/sky/useSkyLocation';
import { useAppSelector } from '../src/store';
import { colors, layout, radii, spacing, typography } from '../src/theme/tokens';

export default function SkyViewerScreen() {
  const offline = useAppSelector(state => state.feed.connection === 'offline');
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const active = focused && foreground;
  const locationControls = useSkyLocation(active);
  const { location } = locationControls;
  const [now, setNow] = useState(Date.now);
  const [selected, setSelected] = useState<SkyPosition>();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!active) return;
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 10_000);
    return () => clearInterval(timer);
  }, [active]);

  const minute = Math.floor(now / 60_000) * 60_000;
  const positions = useMemo(() => aboveHorizon(calculateSky(location, new Date(minute))), [location, minute]);
  const select = useCallback((id: SkyObjectId) => {
    setSelected(positions.find(position => position.id === id));
  }, [positions]);

  const locationLabel = location.kind === 'device'
    ? (location.lastKnown ? 'Last known device location' : location.approximate ? 'Approximate device location' : 'Device location')
    : location.kind === 'preview' ? 'Colombo preview' : 'Entered coordinates';

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
            <SkyViewfinder active={active} usingDeviceLocation={location.kind === 'device'} positions={positions} onSelect={select} />
            <SkyLocationControls {...locationControls} />
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
  section: { ...typography.h2, color: colors.forest, marginTop: spacing[2] },
  objectRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2],
    minHeight: layout.minimumTouchTarget, borderBottomWidth: 1, borderColor: colors.border,
  },
  objectText: { flex: 1 },
  objectName: { ...typography.body, color: colors.forest },
});
