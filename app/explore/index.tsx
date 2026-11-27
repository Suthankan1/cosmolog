import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { useAppSelector } from '../../src/store';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function ExploreHubScreen() {
  const router = useRouter();
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  return (
    <View style={styles.screen}>
      <Header title="Explore & Labs" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.masthead}>
          <Text style={styles.kicker}>INTERACTIVE ASTRONOMICAL LABORATORIES</Text>
          <Text accessibilityRole="header" style={styles.title}>Cosmic Exploration</Text>
          <Text style={styles.summary}>
            Hands-on offline scientific instruments and models designed to explore astronomical scales, light-travel delay, and orbital mechanics.
          </Text>
        </View>

        {/* F03: LightTrace Lab Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open LightTrace laboratory: Cosmic distance and light-travel calculator"
          accessibilityHint="Navigates to the LightTrace interactive explorer"
          style={({ pressed }) => [styles.labCard, pressed && styles.cardPressed]}
          onPress={() => router.push('/explore/lighttrace' as never)}
        >
          <View style={styles.labCardHeader}>
            <View style={styles.tagBadge}>
              <Icon name="sun" size={14} color={colors.terracotta} />
              <Text style={styles.tagText}>LIGHT DYNAMICS · F03</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.forest} />
          </View>

          <Text accessibilityRole="header" style={styles.labTitle}>LightTrace</Text>
          <Text style={styles.labSubtitle}>Cosmic Light-Travel & Distance Explorer</Text>
          <Text style={styles.labCopy}>
            Investigate how the finite speed of light creates an observable time delay across space: from the Moon’s 1.3-second echo to Andromeda’s 2.5-million-year ancient beacon.
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.metricPill}>
              <Icon name="clock" size={13} color={colors.forest} />
              <Text style={styles.metricText}>Exact vacuum c: 299,792,458 m/s</Text>
            </View>
            <View style={styles.metricPill}>
              <Icon name="check-circle" size={13} color={colors.forest} />
              <Text style={styles.metricText}>100% Offline</Text>
            </View>
          </View>
        </Pressable>

        {/* F04: Cosmic Scale Lab Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Cosmic Scale Laboratory: Celestial diameter and distance comparisons"
          accessibilityHint="Navigates to the Cosmic Scale interactive laboratory"
          style={({ pressed }) => [styles.labCard, pressed && styles.cardPressed]}
          onPress={() => router.push('/explore/scale' as never)}
        >
          <View style={styles.labCardHeader}>
            <View style={styles.tagBadge}>
              <Icon name="disc" size={14} color={colors.terracotta} />
              <Text style={styles.tagText}>PLANETARY SCALE · F04</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.forest} />
          </View>

          <Text accessibilityRole="header" style={styles.labTitle}>Cosmic Scale Lab</Text>
          <Text style={styles.labSubtitle}>Planetary Diameters & Travel Simulator</Text>
          <Text style={styles.labCopy}>
            Compare celestial diameters against Earth, explore heliocentric vs geocentric distances, and calculate straight-line travel times at sub-light velocities.
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.metricPill}>
              <Icon name="compass" size={13} color={colors.forest} />
              <Text style={styles.metricText}>NASA Planetary Fact Sheets</Text>
            </View>
            <View style={styles.metricPill}>
              <Icon name="check-circle" size={13} color={colors.forest} />
              <Text style={styles.metricText}>100% Offline</Text>
            </View>
          </View>
        </Pressable>

        {/* F07: Evidence Dossiers Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Behind the Discovery: Research-backed evidence dossiers"
          accessibilityHint="Navigates to the peer-reviewed evidence dossiers index"
          style={({ pressed }) => [styles.labCard, pressed && styles.cardPressed]}
          onPress={() => router.push('/study/dossiers' as never)}
        >
          <View style={styles.labCardHeader}>
            <View style={styles.tagBadge}>
              <Icon name="layers" size={14} color={colors.terracotta} />
              <Text style={styles.tagText}>EVIDENCE DOSSIERS · F07</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.forest} />
          </View>

          <Text accessibilityRole="header" style={styles.labTitle}>Behind the Discovery</Text>
          <Text style={styles.labSubtitle}>Peer-Reviewed Observational Dossiers</Text>
          <Text style={styles.labCopy}>
            Examine empirical measurements, instrumentation, and scientific inferences separating verified facts from artist concepts (Webb WASP-39 b, Europa plumes, and Sgr A* orbits).
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.metricPill}>
              <Icon name="shield" size={13} color={colors.forest} />
              <Text style={styles.metricText}>NASA & Keck Primary Sources</Text>
            </View>
            <View style={styles.metricPill}>
              <Icon name="check-circle" size={13} color={colors.forest} />
              <Text style={styles.metricText}>100% Offline</Text>
            </View>
          </View>
        </Pressable>

        {/* Laboratory Scientific Standards Note */}
        <View style={styles.standardsBox}>
          <View style={styles.standardsHeader}>
            <Icon name="award" size={15} color={colors.forest} />
            <Text style={styles.standardsTitle}>Metrology & Reference Standards</Text>
          </View>
          <Text style={styles.standardsBody}>
            Calculations in COSMOLOG laboratories strictly adhere to International Bureau of Weights and Measures (BIPM) SI base unit definitions and International Astronomical Union (IAU) constants.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  masthead: {
    marginBottom: spacing[6],
  },
  kicker: {
    ...typography.label,
    color: colors.terracotta,
    letterSpacing: 1.2,
    marginBottom: spacing[1],
  },
  title: {
    ...typography.h1,
    color: colors.forest,
    marginBottom: spacing[1],
  },
  summary: {
    ...typography.body,
    color: colors.muted,
  },
  labCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  cardPressed: {
    backgroundColor: colors.sageLight,
  },
  labCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBF0EB',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  tagText: {
    ...typography.label,
    fontSize: 10,
    color: colors.terracotta,
    letterSpacing: 0.8,
  },
  labTitle: {
    ...typography.h2,
    color: colors.forest,
    marginBottom: 2,
  },
  labSubtitle: {
    ...typography.label,
    color: colors.brass,
    marginBottom: spacing[2],
  },
  labCopy: {
    ...typography.body,
    color: colors.ink,
    marginBottom: spacing[4],
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  metricText: {
    ...typography.bodySmall,
    color: colors.forest,
  },
  standardsBox: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    padding: spacing[4],
    marginTop: spacing[2],
  },
  standardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  standardsTitle: {
    ...typography.label,
    color: colors.forest,
  },
  standardsBody: {
    ...typography.bodySmall,
    color: colors.muted,
  },
});
