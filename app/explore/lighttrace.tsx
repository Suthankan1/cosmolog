import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import {
  LIGHT_TARGETS,
  type LightTarget,
} from '../../src/features/labs/data/lighttrace';
import {
  calculateLightTravelSeconds,
  distanceToLogScale,
  distanceToMeters,
  formatDistanceKm,
  formatLightTravelDuration,
} from '../../src/features/labs/lightMath';
import { useAppSelector } from '../../src/store';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';

export default function LightTraceScreen() {
  const router = useRouter();
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const target: LightTarget = LIGHT_TARGETS[selectedIndex] ?? LIGHT_TARGETS[0];

  // Boundaries for the logarithmic scale
  const minMeters = useMemo(
    () => distanceToMeters(LIGHT_TARGETS[0].distanceValue, LIGHT_TARGETS[0].distanceUnit),
    [],
  );
  const maxMeters = useMemo(
    () => distanceToMeters(LIGHT_TARGETS[LIGHT_TARGETS.length - 1].distanceValue, LIGHT_TARGETS[LIGHT_TARGETS.length - 1].distanceUnit),
    [],
  );

  const targetMeters = useMemo(
    () => distanceToMeters(target.distanceValue, target.distanceUnit),
    [target],
  );

  const travelSeconds = useMemo(
    () => calculateLightTravelSeconds(targetMeters),
    [targetMeters],
  );

  const travelDurationText = useMemo(
    () => formatLightTravelDuration(travelSeconds),
    [travelSeconds],
  );

  const logFraction = useMemo(
    () => distanceToLogScale(targetMeters, minMeters, maxMeters),
    [targetMeters, minMeters, maxMeters],
  );

  const openUrl = async (url: string, title: string) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open source', `Could not open link to ${title}.`);
      }
    } catch {
      Alert.alert('Unable to open source', `Could not open link to ${title}.`);
    }
  };

  const selectNext = () => {
    if (selectedIndex < LIGHT_TARGETS.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const selectPrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="LightTrace" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Masthead */}
        <View style={styles.masthead}>
          <Text style={styles.kicker}>OFFLINE LIGHT-TRAVEL TIME EXPLORER · F03</Text>
          <Text accessibilityRole="header" style={styles.title}>The Speed of Starlight</Text>
          <Text style={styles.description}>
            Because light moves at exactly 299,792,458 m/s, looking out across the universe is looking backwards in time.
          </Text>
        </View>

        {/* Target Selector Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
          accessibilityRole="tablist"
        >
          {LIGHT_TARGETS.map((t, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Pressable
                key={t.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${t.name}, ${t.category}`}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setSelectedIndex(index)}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                  {t.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Main Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.targetHeader}>
            <View>
              <Text style={styles.categoryBadge}>{target.category.toUpperCase()}</Text>
              <Text accessibilityRole="header" style={styles.targetName}>{target.name}</Text>
            </View>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous celestial target"
                disabled={selectedIndex === 0}
                style={[styles.stepperBtn, selectedIndex === 0 && styles.stepperBtnDisabled]}
                onPress={selectPrev}
              >
                <Icon name="chevron-left" size={18} color={selectedIndex === 0 ? colors.border : colors.forest} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next celestial target"
                disabled={selectedIndex === LIGHT_TARGETS.length - 1}
                style={[styles.stepperBtn, selectedIndex === LIGHT_TARGETS.length - 1 && styles.stepperBtnDisabled]}
                onPress={selectNext}
              >
                <Icon name="chevron-right" size={18} color={selectedIndex === LIGHT_TARGETS.length - 1 ? colors.border : colors.forest} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.tagline}>{target.tagline}</Text>

          {/* Large Hero Metric Display */}
          <View style={styles.metricHeroBox}>
            <Text style={styles.metricHeroLabel}>LIGHT-TRAVEL DELAY (LOOKBACK)</Text>
            <Text accessibilityRole="text" style={styles.metricHeroValue}>
              {travelDurationText}
            </Text>
            <Text style={styles.metricHeroContext}>
              {target.humanContext}
            </Text>
          </View>

          {/* Interactive Logarithmic Distance Track */}
          <View style={styles.trackSection}>
            <View style={styles.trackLabels}>
              <Text style={styles.trackMinMaxLabel}>Earth Moon (10⁸ m)</Text>
              <Text style={styles.trackMinMaxLabel}>Andromeda (10²³ m)</Text>
            </View>
            <View style={styles.trackBg} accessible accessibilityLabel={`Distance track position: ${Math.round(logFraction * 100)}% on logarithmic cosmic scale`}>
              <View style={[styles.trackFill, { width: `${Math.max(4, logFraction * 100)}%` }]} />
              <View style={[styles.trackThumb, { left: `${Math.max(0, Math.min(94, logFraction * 100))}%` }]} />
            </View>
            <Text style={styles.trackCaption}>
              Logarithmic position: {Math.round(logFraction * 100)}% across cosmic distance ruler
            </Text>
          </View>

          {/* Measurement Details Table */}
          <View style={styles.detailsTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Catalog Distance:</Text>
              <Text style={styles.tableValue}>
                {target.distanceValue.toLocaleString()} {target.distanceUnit}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Metric Equivalent:</Text>
              <Text style={styles.tableValue}>
                {formatDistanceKm(targetMeters)}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Reference Frame:</Text>
              <Text style={styles.tableValue}>{target.referenceFrame}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Precision Standard:</Text>
              <Text style={styles.tableValue}>
                {target.precision.toUpperCase()} ({target.distanceDefinition})
              </Text>
            </View>
          </View>
        </View>

        {/* Scientific Limitations & Assumptions Disclosure */}
        <View style={styles.assumptionsBox}>
          <View style={styles.assumptionsHeader}>
            <Icon name="info" size={15} color={colors.forest} />
            <Text style={styles.assumptionsTitle}>Physical Scope & Model Assumptions</Text>
          </View>
          <Text style={styles.assumptionsCopy}>
            Light travel duration is derived from the linear vacuum relation t = d/c, where c = 299,792,458 m/s (BIPM SI base unit).
            This local flat-space formulation applies accurately across our Solar System and nearby Milky Way/Local Group targets.
            For high-redshift targets billions of light-years away, metric expansion of cosmological spacetime prevents simple Euclidean distance division.
          </Text>
        </View>

        {/* Actionable Sources */}
        <View style={styles.sourcesBox}>
          <Text style={styles.sourcesHeader}>Authoritative Sources & Metrology:</Text>
          {target.sources.map(src => (
            <Pressable
              key={src.id}
              accessibilityRole="link"
              accessibilityLabel={`Open reference source: ${src.title} from ${src.publisher}`}
              accessibilityHint="Opens authoritative scientific source in web browser"
              style={styles.sourceRow}
              onPress={() => void openUrl(src.url, src.title)}
            >
              <View style={styles.sourceTextCol}>
                <Text style={styles.sourceTitle}>{src.title}</Text>
                <Text style={styles.sourcePublisher}>{src.publisher} [{src.id}]</Text>
              </View>
              <Icon name="external-link" size={14} color={colors.forest} />
            </Pressable>
          ))}
        </View>

        {/* Related Deep Links to Study & Sky Viewer */}
        <View style={styles.relatedActions}>
          {target.studyId && (
            <Button
              title="Read related Space Study chapter"
              icon="book-open"
              variant="outline"
              accessibilityLabel={`Open related Space Study guide for ${target.name}`}
              onPress={() => router.push(`/study/${target.studyId}` as never)}
            />
          )}

          {target.skyTargetId && (
            <Button
              title="Show target in Sky Viewer"
              icon="compass"
              variant="outline"
              accessibilityLabel={`View ${target.name} in the local Sky Viewer`}
              onPress={() => router.push({ pathname: '/sky-viewer', params: { target: target.skyTargetId } } as never)}
            />
          )}
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
    marginBottom: spacing[4],
  },
  kicker: {
    ...typography.label,
    color: colors.terracotta,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    ...typography.h1,
    color: colors.forest,
    marginBottom: 4,
  },
  description: {
    ...typography.body,
    color: colors.muted,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[2],
    marginBottom: spacing[2],
  },
  tabChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: layout.minimumTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  tabChipText: {
    ...typography.label,
    color: colors.forest,
  },
  tabChipTextActive: {
    color: colors.ivory,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  categoryBadge: {
    ...typography.label,
    fontSize: 10,
    color: colors.terracotta,
    letterSpacing: 0.8,
  },
  targetName: {
    ...typography.h2,
    color: colors.forest,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 4,
  },
  stepperBtn: {
    width: layout.minimumTouchTarget,
    height: layout.minimumTouchTarget,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  tagline: {
    ...typography.body,
    color: colors.brass,
    marginBottom: spacing[4],
  },
  metricHeroBox: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  metricHeroLabel: {
    ...typography.label,
    color: colors.forest,
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  metricHeroValue: {
    ...typography.display,
    color: colors.forest,
    marginBottom: 4,
  },
  metricHeroContext: {
    ...typography.bodySmall,
    color: colors.ink,
  },
  trackSection: {
    marginBottom: spacing[4],
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackMinMaxLabel: {
    ...typography.meta,
    color: colors.muted,
  },
  trackBg: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.brass,
    borderRadius: radii.pill,
  },
  trackThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.forest,
    borderWidth: 2,
    borderColor: colors.ivory,
  },
  trackCaption: {
    ...typography.meta,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  detailsTable: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
    gap: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  tableLabel: {
    ...typography.label,
    color: colors.muted,
    flex: 1,
  },
  tableValue: {
    ...typography.bodySmall,
    color: colors.ink,
    flex: 1,
    textAlign: 'right',
  },
  assumptionsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  assumptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  assumptionsTitle: {
    ...typography.label,
    color: colors.forest,
  },
  assumptionsCopy: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  sourcesBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  sourcesHeader: {
    ...typography.label,
    color: colors.forest,
    letterSpacing: 0.8,
    marginBottom: spacing[1],
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourceTextCol: {
    flex: 1,
    paddingRight: spacing[2],
  },
  sourceTitle: {
    ...typography.label,
    color: colors.forest,
  },
  sourcePublisher: {
    ...typography.meta,
    color: colors.muted,
  },
  relatedActions: {
    gap: spacing[2],
  },
});
