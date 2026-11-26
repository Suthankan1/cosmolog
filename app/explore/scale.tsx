import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import {
  COSMIC_SCALE_BODIES,
  TRAVEL_SPEED_PRESETS,
  type CosmicBody,
} from '../../src/features/labs/data/scale';
import {
  SPEED_OF_LIGHT_KMH,
  calculateDiameterRatio,
  calculateHypotheticalTravelTime,
  calculateProportionalBarWidth,
  formatScaleKm,
} from '../../src/features/labs/scaleMath';
import { useAppSelector } from '../../src/store';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';

type ScaleMode = 'diameter' | 'distance' | 'travel';
type DistanceReference = 'sun' | 'earth';

export default function CosmicScaleScreen() {
  const router = useRouter();
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [activeMode, setActiveMode] = useState<ScaleMode>('diameter');
  const [selectedBodyId, setSelectedBodyId] = useState<string>('earth');
  const [referenceBodyId, setReferenceBodyId] = useState<string>('earth');
  const [distanceRef, setDistanceRef] = useState<DistanceReference>('sun');

  // Travel mode states
  const [travelPresetId, setTravelPresetId] = useState<string>('voyager-1');
  const [customSpeedInput, setCustomSpeedInput] = useState<string>('');
  const [isCustomSpeed, setIsCustomSpeed] = useState<boolean>(false);

  const selectedBody: CosmicBody = useMemo(
    () => COSMIC_SCALE_BODIES.find(b => b.id === selectedBodyId) ?? COSMIC_SCALE_BODIES[3],
    [selectedBodyId],
  );

  const referenceBody: CosmicBody = useMemo(
    () => COSMIC_SCALE_BODIES.find(b => b.id === referenceBodyId) ?? COSMIC_SCALE_BODIES[3],
    [referenceBodyId],
  );

  // Maximum diameter in dataset for schematic bars (The Sun: 1,392,700 km)
  const maxDiameterKm = useMemo(() => COSMIC_SCALE_BODIES[0].diameterKm, []);

  // Maximum distance in dataset (Saturn from Sun: 1,433,529,000 km)
  const maxDistanceKm = useMemo(
    () => Math.max(...COSMIC_SCALE_BODIES.map(b => b.meanSunDistanceKm)),
    [],
  );

  const diameterRatio = useMemo(() => {
    try {
      return calculateDiameterRatio(selectedBody.diameterKm, referenceBody.diameterKm);
    } catch {
      return 1.0;
    }
  }, [selectedBody, referenceBody]);

  // Current active speed in km/h for travel calculator
  const activeSpeedKmH = useMemo(() => {
    if (isCustomSpeed) {
      const parsed = parseFloat(customSpeedInput);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    const preset = TRAVEL_SPEED_PRESETS.find(p => p.id === travelPresetId);
    return preset?.speedKmPerHour ?? 61_200;
  }, [isCustomSpeed, customSpeedInput, travelPresetId]);

  // Target distance in km for travel calculation
  const travelDistanceKm = useMemo(() => {
    if (selectedBody.id === 'earth') {
      return 384_400; // default to Moon distance if Earth is selected
    }
    return selectedBody.meanEarthDistanceKm;
  }, [selectedBody]);

  // Travel calculation result
  const travelResult = useMemo(() => {
    if (activeSpeedKmH <= 0 || activeSpeedKmH >= SPEED_OF_LIGHT_KMH) {
      return null;
    }
    try {
      return calculateHypotheticalTravelTime(travelDistanceKm, activeSpeedKmH);
    } catch {
      return null;
    }
  }, [travelDistanceKm, activeSpeedKmH]);

  const openUrl = async (url: string, title: string) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', `Could not open link to ${title}.`);
      }
    } catch {
      Alert.alert('Unable to open link', `Could not open link to ${title}.`);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Cosmic Scale Lab" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Masthead */}
        <View style={styles.masthead}>
          <Text style={styles.kicker}>OFFLINE ASTRONOMICAL SCALE LABORATORY · F04</Text>
          <Text accessibilityRole="header" style={styles.title}>Cosmic Scale & Distances</Text>
          <Text style={styles.summary}>
            Compare celestial diameters, orbital spans, and straight-line travel times across the Solar System using exact NASA Planetary Fact Sheet metrics.
          </Text>
        </View>

        {/* Mode Switcher Tabs */}
        <View style={styles.modeTabBar} accessibilityRole="tablist">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeMode === 'diameter' }}
            accessibilityLabel="Diameter Comparison Mode"
            style={[styles.modeTab, activeMode === 'diameter' && styles.modeTabActive]}
            onPress={() => setActiveMode('diameter')}
          >
            <Icon name="disc" size={14} color={activeMode === 'diameter' ? colors.ivory : colors.forest} />
            <Text style={[styles.modeTabText, activeMode === 'diameter' && styles.modeTabTextActive]}>
              Diameter
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeMode === 'distance' }}
            accessibilityLabel="Distance Comparison Mode"
            style={[styles.modeTab, activeMode === 'distance' && styles.modeTabActive]}
            onPress={() => setActiveMode('distance')}
          >
            <Icon name="navigation" size={14} color={activeMode === 'distance' ? colors.ivory : colors.forest} />
            <Text style={[styles.modeTabText, activeMode === 'distance' && styles.modeTabTextActive]}>
              Distance
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeMode === 'travel' }}
            accessibilityLabel="Travel Time Simulator Mode"
            style={[styles.modeTab, activeMode === 'travel' && styles.modeTabActive]}
            onPress={() => setActiveMode('travel')}
          >
            <Icon name="clock" size={14} color={activeMode === 'travel' ? colors.ivory : colors.forest} />
            <Text style={[styles.modeTabText, activeMode === 'travel' && styles.modeTabTextActive]}>
              Travel Time
            </Text>
          </Pressable>
        </View>

        {/* Target Body Selector Carousel */}
        <Text style={styles.sectionKicker}>SELECT CELESTIAL TARGET</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bodyCarousel}
          accessibilityRole="tablist"
        >
          {COSMIC_SCALE_BODIES.map(b => {
            const isSelected = b.id === selectedBodyId;
            return (
              <Pressable
                key={b.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${b.name}, ${b.category}`}
                style={[styles.bodyChip, isSelected && styles.bodyChipActive]}
                onPress={() => setSelectedBodyId(b.id)}
              >
                <Text style={[styles.bodyChipText, isSelected && styles.bodyChipTextActive]}>
                  {b.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 1. DIAMETER MODE */}
        {activeMode === 'diameter' && (
          <View style={styles.panelCard}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelCategory}>{selectedBody.category.toUpperCase()}</Text>
                <Text accessibilityRole="header" style={styles.panelTitle}>{selectedBody.name}</Text>
              </View>
              <View style={styles.ratioPill}>
                <Text style={styles.ratioText}>
                  {diameterRatio >= 1 ? `${diameterRatio.toFixed(2)}×` : `1/${(1 / diameterRatio).toFixed(2)}`}
                </Text>
              </View>
            </View>

            <Text style={styles.panelContext}>{selectedBody.context}</Text>

            {/* Reference baseline picker */}
            <View style={styles.baselinePickerRow}>
              <Text style={styles.pickerLabel}>Compared to reference:</Text>
              <View style={styles.baselineOptions}>
                {['earth', 'sun', 'moon', 'jupiter'].map(refId => {
                  const isRef = refId === referenceBodyId;
                  const refBody = COSMIC_SCALE_BODIES.find(b => b.id === refId);
                  return (
                    <Pressable
                      key={refId}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isRef }}
                      accessibilityLabel={`Set comparison baseline to ${refBody?.name}`}
                      style={[styles.baselineBtn, isRef && styles.baselineBtnActive]}
                      onPress={() => setReferenceBodyId(refId)}
                    >
                      <Text style={[styles.baselineBtnText, isRef && styles.baselineBtnTextActive]}>
                        {refBody?.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Schematic Bar Visualizer */}
            <View style={styles.schematicBox}>
              <Text style={styles.schematicTitle}>Proportional Diameter Scale (Schematic)</Text>

              <View style={styles.barItem}>
                <View style={styles.barMeta}>
                  <Text style={styles.barLabel}>{selectedBody.name}</Text>
                  <Text style={styles.barValue}>{formatScaleKm(selectedBody.diameterKm)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFillSelected,
                      { width: `${calculateProportionalBarWidth(selectedBody.diameterKm, maxDiameterKm)}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barMeta}>
                  <Text style={styles.barLabel}>{referenceBody.name} (Baseline)</Text>
                  <Text style={styles.barValue}>{formatScaleKm(referenceBody.diameterKm)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFillReference,
                      { width: `${calculateProportionalBarWidth(referenceBody.diameterKm, maxDiameterKm)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Metrics table */}
            <View style={styles.metricsTable}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Volumetric Diameter:</Text>
                <Text style={styles.tableValue}>{selectedBody.diameterKm.toLocaleString()} km</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Relative to {referenceBody.name}:</Text>
                <Text style={styles.tableValue}>{diameterRatio.toFixed(3)}×</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Measurement Standard:</Text>
                <Text style={styles.tableValue}>{selectedBody.diameterConvention} (S05)</Text>
              </View>
            </View>
          </View>
        )}

        {/* 2. DISTANCE MODE */}
        {activeMode === 'distance' && (
          <View style={styles.panelCard}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelCategory}>ORBITAL MECHANICS & GAPS</Text>
                <Text accessibilityRole="header" style={styles.panelTitle}>{selectedBody.name}</Text>
              </View>
            </View>

            <Text style={styles.panelContext}>
              Planets follow elliptical orbits around the Sun. Distances from the Sun represent stable semi-major axes, whereas distances from Earth vary continuously as both bodies orbit.
            </Text>

            {/* Reference toggle: Sun vs Earth */}
            <View style={styles.referenceToggleRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: distanceRef === 'sun' }}
                accessibilityLabel="Show distance from Sun (heliocentric semi-major axis)"
                style={[styles.toggleBtn, distanceRef === 'sun' && styles.toggleBtnActive]}
                onPress={() => setDistanceRef('sun')}
              >
                <Text style={[styles.toggleBtnText, distanceRef === 'sun' && styles.toggleBtnTextActive]}>
                  From Sun (Heliocentric)
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: distanceRef === 'earth' }}
                accessibilityLabel="Show distance from Earth (geocentric variable distance)"
                style={[styles.toggleBtn, distanceRef === 'earth' && styles.toggleBtnActive]}
                onPress={() => setDistanceRef('earth')}
              >
                <Text style={[styles.toggleBtnText, distanceRef === 'earth' && styles.toggleBtnTextActive]}>
                  From Earth (Geocentric)
                </Text>
              </Pressable>
            </View>

            {/* Distance Details Box */}
            {distanceRef === 'sun' ? (
              <View style={styles.heroDistanceBox}>
                <Text style={styles.heroDistanceLabel}>SEMI-MAJOR AXIS (MEAN DISTANCE FROM SUN)</Text>
                <Text accessibilityRole="text" style={styles.heroDistanceValue}>
                  {selectedBody.meanSunDistanceAU.toFixed(3)} AU
                </Text>
                <Text style={styles.heroDistanceSub}>
                  {formatScaleKm(selectedBody.meanSunDistanceKm)}
                </Text>
              </View>
            ) : (
              <View style={styles.heroDistanceBox}>
                <Text style={styles.heroDistanceLabel}>AVERAGE DISTANCE FROM EARTH</Text>
                <Text accessibilityRole="text" style={styles.heroDistanceValue}>
                  {formatScaleKm(selectedBody.meanEarthDistanceKm)}
                </Text>
                {selectedBody.id !== 'earth' && (
                  <Text style={styles.heroDistanceSub}>
                    Approaches from {formatScaleKm(selectedBody.minEarthDistanceKm)} to {formatScaleKm(selectedBody.maxEarthDistanceKm)}
                  </Text>
                )}
              </View>
            )}

            {/* Distance Comparison Bar */}
            <View style={styles.schematicBox}>
              <Text style={styles.schematicTitle}>Heliocentric Solar System Span</Text>
              <View style={styles.barItem}>
                <View style={styles.barMeta}>
                  <Text style={styles.barLabel}>{selectedBody.name}</Text>
                  <Text style={styles.barValue}>{formatScaleKm(selectedBody.meanSunDistanceKm)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFillDistance,
                      { width: `${calculateProportionalBarWidth(selectedBody.meanSunDistanceKm, maxDistanceKm)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Distance Data Table */}
            <View style={styles.metricsTable}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Mean Sun Distance (AU):</Text>
                <Text style={styles.tableValue}>{selectedBody.meanSunDistanceAU.toFixed(3)} AU</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Mean Sun Distance (km):</Text>
                <Text style={styles.tableValue}>{selectedBody.meanSunDistanceKm.toLocaleString()} km</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Mean Earth Distance:</Text>
                <Text style={styles.tableValue}>{selectedBody.meanEarthDistanceKm.toLocaleString()} km</Text>
              </View>
              {selectedBody.id !== 'earth' && (
                <>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Closest Earth Approach:</Text>
                    <Text style={styles.tableValue}>{selectedBody.minEarthDistanceKm.toLocaleString()} km</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Furthest Earth Distance:</Text>
                    <Text style={styles.tableValue}>{selectedBody.maxEarthDistanceKm.toLocaleString()} km</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* 3. TRAVEL TIME SIMULATOR MODE */}
        {activeMode === 'travel' && (
          <View style={styles.panelCard}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelCategory}>HYPOTHETICAL STRAIGHT-LINE EXPEDITION</Text>
                <Text accessibilityRole="header" style={styles.panelTitle}>Travel to {selectedBody.name}</Text>
              </View>
            </View>

            <Text style={styles.panelContext}>
              Straight-line Euclidean distance: {formatScaleKm(travelDistanceKm)} from Earth.
            </Text>

            {/* Speed Presets */}
            <Text style={styles.pickerLabel}>Select hypothetical speed velocity:</Text>
            <View style={styles.presetGrid}>
              {TRAVEL_SPEED_PRESETS.map(preset => {
                const isSelected = !isCustomSpeed && travelPresetId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${preset.name}: ${preset.speedDescription}`}
                    style={[styles.presetCard, isSelected && styles.presetCardActive]}
                    onPress={() => {
                      setIsCustomSpeed(false);
                      setTravelPresetId(preset.id);
                    }}
                  >
                    <Text style={[styles.presetName, isSelected && styles.presetNameActive]}>
                      {preset.name}
                    </Text>
                    <Text style={[styles.presetSpeed, isSelected && styles.presetSpeedActive]}>
                      {preset.speedDescription}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Speed Option */}
            <View style={styles.customSpeedRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isCustomSpeed }}
                accessibilityLabel="Enter custom travel speed in km/h"
                style={[styles.customCheckbox, isCustomSpeed && styles.customCheckboxActive]}
                onPress={() => setIsCustomSpeed(!isCustomSpeed)}
              >
                {isCustomSpeed && <Icon name="check" size={14} color={colors.ivory} />}
              </Pressable>
              <Text style={styles.customLabel}>Custom speed (km/h):</Text>
              <TextInput
                accessibilityLabel="Custom speed in kilometres per hour"
                value={customSpeedInput}
                editable={isCustomSpeed}
                keyboardType="numeric"
                placeholder="e.g. 50000"
                placeholderTextColor={colors.muted}
                style={[styles.speedInput, !isCustomSpeed && styles.speedInputDisabled]}
                onChangeText={txt => {
                  setCustomSpeedInput(txt);
                  if (!isCustomSpeed) setIsCustomSpeed(true);
                }}
              />
            </View>

            {/* Validation warning if speed exceeds light or is non-positive */}
            {activeSpeedKmH >= SPEED_OF_LIGHT_KMH && (
              <View style={styles.warningBox}>
                <Icon name="alert-triangle" size={15} color={colors.danger} />
                <Text style={styles.warningText}>
                  Speed must be strictly below the speed of light c ({Math.round(SPEED_OF_LIGHT_KMH).toLocaleString()} km/h).
                </Text>
              </View>
            )}

            {activeSpeedKmH <= 0 && isCustomSpeed && (
              <View style={styles.warningBox}>
                <Icon name="info" size={15} color={colors.forest} />
                <Text style={styles.warningText}>
                  Please enter a positive numeric speed in km/h.
                </Text>
              </View>
            )}

            {/* Travel Time Hero Result */}
            {travelResult && (
              <View style={styles.heroResultBox}>
                <Text style={styles.heroResultLabel}>ESTIMATED STRAIGHT-LINE TRAVEL TIME</Text>
                <Text accessibilityRole="text" style={styles.heroResultValue}>
                  {travelResult.formatted}
                </Text>
                <Text style={styles.heroResultSub}>
                  {travelResult.hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} total hours ({travelResult.days.toLocaleString(undefined, { maximumFractionDigits: 1 })} days)
                </Text>
              </View>
            )}

            {/* Scientific Caveat / Disclaimer */}
            <View style={styles.disclaimerBox}>
              <View style={styles.disclaimerHeader}>
                <Icon name="info" size={14} color={colors.forest} />
                <Text style={styles.disclaimerTitle}>Orbital Mechanics Scope & Limitations</Text>
              </View>
              <Text style={styles.disclaimerText}>
                This simulator calculates a constant-speed Euclidean straight line (t = d / v).
                Real interplanetary spacecraft never travel along straight lines; they follow curved Keplerian transfer orbits (such as Hohmann transfer ellipses), utilize planetary gravitational slingshots, and undergo continuous acceleration/deceleration.
              </Text>
            </View>
          </View>
        )}

        {/* Authoritative Sources & Citations */}
        <View style={styles.sourcesBox}>
          <Text style={styles.sourcesHeader}>Authoritative Sources & Metrology Standards:</Text>
          {selectedBody.sources.map(src => (
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

        {/* Cross-Feature Links (Study, Expeditions, Sky Viewer) */}
        <View style={styles.crossLinks}>
          {selectedBody.studyId && (
            <Button
              title={`Read ${selectedBody.name} Study Chapter`}
              icon="book-open"
              variant="outline"
              accessibilityLabel={`Open Space Study chapter for ${selectedBody.name}`}
              onPress={() => router.push(`/study/${selectedBody.studyId}` as never)}
            />
          )}

          {selectedBody.expeditionId && (
            <Button
              title={`Join ${selectedBody.name} Expedition`}
              icon="compass"
              variant="outline"
              accessibilityLabel={`Open related Expedition for ${selectedBody.name}`}
              onPress={() => router.push('/reading-packs' as never)}
            />
          )}

          {selectedBody.skyTargetId && (
            <Button
              title={`Locate ${selectedBody.name} in Sky Viewer`}
              icon="crosshair"
              variant="outline"
              accessibilityLabel={`View ${selectedBody.name} in the local Sky Viewer`}
              onPress={() => router.push({ pathname: '/sky-viewer', params: { target: selectedBody.skyTargetId } } as never)}
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
  summary: {
    ...typography.body,
    color: colors.muted,
  },
  modeTabBar: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: layout.minimumTouchTarget,
  },
  modeTabActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  modeTabText: {
    ...typography.label,
    color: colors.forest,
  },
  modeTabTextActive: {
    color: colors.ivory,
  },
  sectionKicker: {
    ...typography.label,
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  bodyCarousel: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[2],
    marginBottom: spacing[4],
  },
  bodyChip: {
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
  bodyChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  bodyChipText: {
    ...typography.label,
    color: colors.forest,
  },
  bodyChipTextActive: {
    color: colors.ivory,
  },
  panelCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  panelCategory: {
    ...typography.label,
    fontSize: 10,
    color: colors.terracotta,
    letterSpacing: 0.8,
  },
  panelTitle: {
    ...typography.h2,
    color: colors.forest,
  },
  ratioPill: {
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  ratioText: {
    ...typography.label,
    color: colors.forest,
  },
  panelContext: {
    ...typography.bodySmall,
    color: colors.ink,
    lineHeight: 18,
    marginBottom: spacing[4],
  },
  baselinePickerRow: {
    marginBottom: spacing[4],
  },
  pickerLabel: {
    ...typography.label,
    color: colors.muted,
    marginBottom: spacing[1],
  },
  baselineOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  baselineBtn: {
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: layout.minimumTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  baselineBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  baselineBtnText: {
    ...typography.bodySmall,
    color: colors.forest,
  },
  baselineBtnTextActive: {
    color: colors.ivory,
  },
  schematicBox: {
    backgroundColor: colors.ivory,
    borderRadius: radii.sm,
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  schematicTitle: {
    ...typography.label,
    color: colors.forest,
    fontSize: 11,
    marginBottom: 4,
  },
  barItem: {
    gap: 4,
  },
  barMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
  },
  barValue: {
    ...typography.meta,
    color: colors.muted,
  },
  barTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  barFillSelected: {
    height: '100%',
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
  },
  barFillReference: {
    height: '100%',
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
  },
  barFillDistance: {
    height: '100%',
    backgroundColor: colors.brass,
    borderRadius: radii.pill,
  },
  metricsTable: {
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
  referenceToggleRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
  },
  toggleBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  toggleBtnText: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
  },
  toggleBtnTextActive: {
    color: colors.ivory,
  },
  heroDistanceBox: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  heroDistanceLabel: {
    ...typography.label,
    color: colors.forest,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroDistanceValue: {
    ...typography.display,
    color: colors.forest,
    marginBottom: 2,
  },
  heroDistanceSub: {
    ...typography.bodySmall,
    color: colors.ink,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  presetCard: {
    width: '48%',
    backgroundColor: colors.ivory,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[2],
    minHeight: layout.minimumTouchTarget,
    justifyContent: 'center',
  },
  presetCardActive: {
    borderColor: colors.forest,
    backgroundColor: colors.sageLight,
  },
  presetName: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
    marginBottom: 2,
  },
  presetNameActive: {
    color: colors.forestDark,
  },
  presetSpeed: {
    ...typography.meta,
    color: colors.muted,
  },
  presetSpeedActive: {
    color: colors.ink,
  },
  customSpeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.forest,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customCheckboxActive: {
    backgroundColor: colors.forest,
  },
  customLabel: {
    ...typography.label,
    color: colors.ink,
  },
  speedInput: {
    flex: 1,
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[2],
    ...typography.body,
    color: colors.ink,
  },
  speedInputDisabled: {
    opacity: 0.5,
    backgroundColor: colors.ivory,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBF0EB',
    padding: spacing[2],
    borderRadius: radii.sm,
    marginBottom: spacing[4],
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
  heroResultBox: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  heroResultLabel: {
    ...typography.label,
    color: colors.forest,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroResultValue: {
    ...typography.display,
    color: colors.forest,
    marginBottom: 4,
  },
  heroResultSub: {
    ...typography.bodySmall,
    color: colors.ink,
  },
  disclaimerBox: {
    backgroundColor: colors.ivory,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  disclaimerTitle: {
    ...typography.label,
    color: colors.forest,
  },
  disclaimerText: {
    ...typography.meta,
    color: colors.muted,
    lineHeight: 16,
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
  crossLinks: {
    gap: spacing[2],
  },
});
