import React, { useEffect, useMemo, useState } from 'react';
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
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { useAppSelector } from '../../src/store';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import {
  CultureOverlay,
  CultureSegment,
} from '../../src/features/sky/catalog/cultures/types';
import { listCultureOverlays } from '../../src/features/sky/catalog/cultures/cultureRepository';
import {
  projectAllCultureStars,
  ProjectedCultureStar,
} from '../../src/features/sky/catalog/cultures/cultureProjection';

type Mode = 'al-jawza' | 'shen' | 'both';

export default function SkyCulturesScreen() {
  const router = useRouter();
  const { connection, metadata, legacySyncedAt } = useAppSelector((state) => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod']?.lastSyncedAt ?? legacySyncedAt;

  const [overlays, setOverlays] = useState<CultureOverlay[]>([]);
  const [mode, setMode] = useState<Mode>('al-jawza');
  const [chartWidth, setChartWidth] = useState(340);
  const chartHeight = 360;

  useEffect(() => {
    listCultureOverlays().then(setOverlays);
  }, []);

  const arabicCulture = useMemo(
    () => overlays.find((c) => c.id === 'culture:arabic-bedouin'),
    [overlays]
  );
  const chineseCulture = useMemo(
    () => overlays.find((c) => c.id === 'culture:chinese-traditional'),
    [overlays]
  );

  const activeCulture = mode === 'shen' ? chineseCulture : arabicCulture;
  const activeAsterism = activeCulture?.asterisms[0];

  // Compute projected positions for all 7 stars (stable across modes)
  const projectedStars = useMemo(() => {
    if (!activeAsterism) return new Map<number, ProjectedCultureStar>();
    return projectAllCultureStars(activeAsterism.stars, chartWidth, chartHeight, 36);
  }, [activeAsterism, chartWidth]);

  // Gather segments based on current mode
  const activeSegments = useMemo(() => {
    const segments: { segment: CultureSegment; color: string; cultureId: string }[] = [];
    if ((mode === 'al-jawza' || mode === 'both') && arabicCulture) {
      for (const seg of arabicCulture.asterisms[0].segments) {
        segments.push({ segment: seg, color: colors.brass, cultureId: arabicCulture.id });
      }
    }
    if ((mode === 'shen' || mode === 'both') && chineseCulture) {
      for (const seg of chineseCulture.asterisms[0].segments) {
        segments.push({ segment: seg, color: colors.terracotta, cultureId: chineseCulture.id });
      }
    }
    return segments;
  }, [mode, arabicCulture, chineseCulture]);

  const handleOpenSource = async (url: string) => {
    if (offline) {
      Alert.alert('Offline Mode', 'External source citations require an active internet connection.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Could not open citation', 'The external link could not be opened.');
      }
    } catch {
      Alert.alert('Could not open citation', 'Failed to navigate to external link.');
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="One Sky, Many Stories" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Masthead */}
        <View style={styles.masthead}>
          <Text style={styles.kicker}>CULTURAL ASTRONOMY · F08</Text>
          <Text accessibilityRole="header" style={styles.title}>
            One Sky, Many Stories
          </Text>
          <Text style={styles.summary}>
            Across civilizations, human observers watched the exact same celestial equator stars and perceived radically different mythologies, calendars, and structures.
          </Text>
        </View>

        {/* Tradition Selector Tabs */}
        <View style={styles.modeTabs} testID="culture-selector-tabs">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'al-jawza' }}
            accessibilityLabel="Al-Jawza': Indigenous Arabic & Bedouin Sky Culture"
            style={[styles.modeTab, mode === 'al-jawza' && styles.modeTabActive]}
            onPress={() => setMode('al-jawza')}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'al-jawza' && styles.modeTabTextActive,
              ]}
            >
              Al-Jawza’ (Arabic)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'shen' }}
            accessibilityLabel="Shen: Chinese Traditional Twenty-Eight Mansions"
            style={[styles.modeTab, mode === 'shen' && styles.modeTabActive]}
            onPress={() => setMode('shen')}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'shen' && styles.modeTabTextActive,
              ]}
            >
              Shen (Chinese)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'both' }}
            accessibilityLabel="Side-by-side comparative overlay of Arabic and Chinese traditions"
            style={[styles.modeTab, mode === 'both' && styles.modeTabActive]}
            onPress={() => setMode('both')}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'both' && styles.modeTabTextActive,
              ]}
            >
              Compare Both
            </Text>
          </Pressable>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {(mode === 'al-jawza' || mode === 'both') && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.brass }]} />
              <Text style={styles.legendLabel}>Al-Jawza’ (Brass)</Text>
            </View>
          )}
          {(mode === 'shen' || mode === 'both') && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.terracotta }]} />
              <Text style={styles.legendLabel}>Shen (Terracotta)</Text>
            </View>
          )}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.ivory }]} />
            <Text style={styles.legendLabel}>J2000 Stars</Text>
          </View>
        </View>

        {/* Cultural Sky Chart */}
        <View
          style={[styles.chartContainer, { height: chartHeight }]}
          testID="culture-sky-chart"
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - chartWidth) > 5) {
              setChartWidth(w);
            }
          }}
        >
          {/* Constellation line segments */}
          {activeSegments.map(({ segment, color, cultureId }, index) => {
            const p1 = projectedStars.get(segment.fromHip);
            const p2 = projectedStars.get(segment.toHip);
            if (!p1 || !p2) return null;

            const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const cx = (p1.x + p2.x) / 2;
            const cy = (p1.y + p2.y) / 2;

            return (
              <View
                key={`${cultureId}-${segment.fromHip}-${segment.toHip}-${index}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: length,
                  height: mode === 'both' ? 1.5 : 2,
                  backgroundColor: color,
                  left: cx - length / 2,
                  top: cy - (mode === 'both' ? 0.75 : 1),
                  opacity: mode === 'both' ? 0.75 : 0.9,
                  transform: [{ rotate: `${angle}rad` }],
                }}
              />
            );
          })}

          {/* Star markers and labels */}
          {Array.from(projectedStars.values()).map((star) => {
            // Diameter inversely related to magnitude
            const radius = Math.max(4, Math.round(7 - star.magnitude * 1.5));
            const isRedSupergiant = star.hip === 27989; // Betelgeuse
            const starColor = isRedSupergiant ? '#F4976C' : '#F8F4EA';

            // Resolve name in current mode
            let label = star.name;
            if (mode === 'al-jawza' && arabicCulture) {
              const matched = arabicCulture.asterisms[0].stars.find((s) => s.hip === star.hip);
              if (matched) label = matched.nativeName;
            } else if (mode === 'shen' && chineseCulture) {
              const matched = chineseCulture.asterisms[0].stars.find((s) => s.hip === star.hip);
              if (matched) label = matched.nativeName;
            }

            return (
              <View
                key={`star-${star.hip}`}
                pointerEvents="none"
                style={[
                  styles.starContainer,
                  {
                    left: star.x - radius,
                    top: star.y - radius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.starDot,
                    {
                      width: radius * 2,
                      height: radius * 2,
                      borderRadius: radius,
                      backgroundColor: starColor,
                    },
                  ]}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.starLabel,
                    {
                      left: radius + 4,
                      top: -6,
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}

          {/* Sky Orientation Badge */}
          <View style={styles.chartCompass}>
            <Text style={styles.chartCompassText}>N ↑</Text>
            <Text style={styles.chartCompassText}>← E (Sky View)</Text>
          </View>
        </View>

        {/* Narrative & Cultural Context */}
        {activeCulture && mode !== 'both' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cultureBadge}>
                <Text style={styles.cultureBadgeText}>{activeCulture.region}</Text>
              </View>
              <Text style={styles.cultureReviewed}>Verified: {activeCulture.reviewedAt}</Text>
            </View>

            <Text accessibilityRole="header" style={styles.cardTitle}>
              {activeAsterism?.name} ({activeAsterism?.nativeScript})
            </Text>
            <Text style={styles.cardSubtitle}>{activeAsterism?.englishName}</Text>
            <Text style={styles.cardBody}>{activeCulture.historicalContext}</Text>

            {/* Contrast with Modern IAU Orion Warning */}
            <View style={styles.contrastBox}>
              <View style={styles.contrastHeader}>
                <Icon name="info" size={15} color={colors.terracotta} />
                <Text style={styles.contrastTitle}>Distinct from Modern IAU Orion</Text>
              </View>
              <Text style={styles.contrastBody}>{activeCulture.contrastWithIAU}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>
              Cross-Cultural Astrological Comparison
            </Text>
            <Text style={styles.cardBody}>
              Comparing Indigenous Arabic Al-Jawza’ (Brass) and Chinese Traditional Shen (Terracotta) overlays on the exact same J2000 star coordinates. Notice how both cultures independently recognized the three-star belt as a central triad (The Pearl String vs The Three Generals), while connecting the outer body stars according to entirely separate celestial cosmologies.
            </Text>
          </View>
        )}

        {/* Accessible Star Telemetry Table */}
        <View style={styles.tableSection}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Accessible Star & Segment Telemetry
          </Text>
          <Text style={styles.sectionSubtitle}>
            Tabular listing of all asterism stars and catalog properties:
          </Text>

          <View style={styles.tableContainer}>
            {Array.from(projectedStars.values()).map((star) => (
              <View key={`table-${star.hip}`} style={styles.tableRow}>
                <View style={styles.tableMain}>
                  <Text style={styles.tableStarName}>
                    {star.nativeName} ({star.name})
                  </Text>
                  <Text style={styles.tableRole}>{star.role ?? 'Constellation star'}</Text>
                </View>
                <View style={styles.tableCoords}>
                  <Text style={styles.tableCoordText}>HIP {star.hip}</Text>
                  <Text style={styles.tableCoordText}>
                    RA {star.ra.toFixed(2)}h · Dec {star.dec > 0 ? '+' : ''}{star.dec.toFixed(1)}°
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Primary References & License */}
        {activeCulture && (
          <View style={styles.sourcesSection}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Cultural References & Rights
            </Text>
            <Text style={styles.licenseNotice}>
              Attribution: {activeCulture.licenses.attribution} ({activeCulture.licenses.dataLicense})
            </Text>

            {activeCulture.sourceRefs.map((ref) => (
              <View key={ref.id} style={styles.sourceCard}>
                <Text style={styles.sourceTitle}>{ref.title}</Text>
                <Text style={styles.sourcePublisher}>{ref.publisher}</Text>
                <Button
                  title={offline ? 'Source link (offline)' : 'View authoritative catalog'}
                  icon="external-link"
                  variant="outline"
                  disabled={offline}
                  onPress={() => void handleOpenSource(ref.url)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Deep Link to Sky Viewer */}
        <View style={{ marginTop: spacing[4], gap: spacing[2] }}>
          <Button
            title="Inspect in Sky Viewer"
            icon="compass"
            variant="destination"
            onPress={() => router.push({ pathname: '/sky-viewer', params: { target: 'hip:27989' } } as never)}
          />
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
  modeTabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  modeTab: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modeTabActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  modeTabText: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
  },
  modeTabTextActive: {
    color: colors.ivory,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.bodySmall,
    color: colors.forest,
    fontSize: 12,
  },
  chartContainer: {
    backgroundColor: '#184235',
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.forest,
  },
  starContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  starDot: {
    borderWidth: 1,
    borderColor: '#FFFFFF88',
  },
  starLabel: {
    position: 'absolute',
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.ivory,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  chartCompass: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  chartCompassText: {
    ...typography.bodySmall,
    fontSize: 9,
    color: colors.sageLight,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  cultureBadge: {
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  cultureBadgeText: {
    ...typography.label,
    fontSize: 10,
    color: colors.forest,
  },
  cultureReviewed: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.muted,
  },
  cardTitle: {
    ...typography.h2,
    fontSize: 20,
    color: colors.forest,
    marginBottom: 2,
  },
  cardSubtitle: {
    ...typography.label,
    color: colors.brass,
    marginBottom: spacing[3],
  },
  cardBody: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 21,
    marginBottom: spacing[3],
  },
  contrastBox: {
    backgroundColor: '#FFFBF9',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#E8D4CE',
    padding: spacing[3],
    gap: 4,
  },
  contrastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contrastTitle: {
    ...typography.label,
    fontSize: 11,
    color: colors.terracotta,
  },
  contrastBody: {
    ...typography.bodySmall,
    color: colors.ink,
    lineHeight: 18,
  },
  tableSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.forest,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.muted,
    marginBottom: spacing[3],
  },
  tableContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableMain: {
    flex: 1,
  },
  tableStarName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.forest,
    fontSize: 13,
  },
  tableRole: {
    ...typography.bodySmall,
    color: colors.muted,
    fontSize: 11,
  },
  tableCoords: {
    alignItems: 'flex-end',
  },
  tableCoordText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.ink,
  },
  sourcesSection: {
    marginBottom: spacing[4],
  },
  licenseNotice: {
    ...typography.bodySmall,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: spacing[3],
  },
  sourceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  sourceTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.forest,
  },
  sourcePublisher: {
    ...typography.bodySmall,
    color: colors.muted,
  },
});
