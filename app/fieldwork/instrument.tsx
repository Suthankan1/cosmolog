import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { findSkyObject, type SkyObjectId } from '../../src/features/sky/catalog';
import {
  cardinalDirection,
  type InstrumentQuality,
  type InstrumentReference,
} from '../../src/features/sky/pointing';
import { clampAltitude, wrapDegrees } from '../../src/features/sky/projection';
import { calculateSky, type SkyPosition } from '../../src/features/sky/skyMath';
import { useRememberedLocation } from '../../src/features/sky/useRememberedLocation';
import { useSkyPointing } from '../../src/features/sky/useSkyPointing';
import { useAppSelector } from '../../src/store';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';
import type { InstrumentSnapshot } from '../../src/database/repositories/observationsRepository';

export default function CelestialInstrumentScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const active = focused && foreground;

  // Route parameters for target tracking or return flow
  const params = useLocalSearchParams<{
    targetId?: string;
    targetName?: string;
    returnTo?: string;
  }>();

  const targetId = params.targetId;
  const targetName = params.targetName ?? (targetId ? findSkyObject(targetId as SkyObjectId)?.name : undefined);
  const isSolarTarget = targetId === 'body:Sun' || targetName?.toLowerCase() === 'sun';

  // Sensor vs Manual mode
  const [mode, setMode] = useState<'sensors' | 'manual'>('sensors');
  const [manualAzimuth, setManualAzimuth] = useState<number>(180);
  const [manualAltitude, setManualAltitude] = useState<number>(30);
  const [manualAzimuthInput, setManualAzimuthInput] = useState<string>('180');
  const [manualAltitudeInput, setManualAltitudeInput] = useState<string>('30');
  const [manualTimestamp, setManualTimestamp] = useState<number>(0);

  // Shared pointing hook (foreground-only, zero background execution)
  const wantsSensors = mode === 'sensors' && active;
  const pointingState = useSkyPointing(wantsSensors, reducedMotion);

  // AppState foreground tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      setForeground(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  // Sky location for target relative offset
  const locationControls = useRememberedLocation(active);
  const targetPosition = useMemo((): SkyPosition | undefined => {
    if (!targetId || !active) return undefined;
    try {
      const positions = calculateSky(locationControls.location, new Date());
      return positions.find(p => p.id === targetId);
    } catch {
      return undefined;
    }
  }, [targetId, active, locationControls.location]);

  // Derived current measurement
  const currentReading = useMemo(() => {
    if (mode === 'manual' || pointingState.status !== 'ready') {
      return {
        azimuth: manualAzimuth,
        altitude: manualAltitude,
        cardinal: cardinalDirection(manualAzimuth),
        reference: 'unknown' as InstrumentReference,
        quality: 'manual' as InstrumentQuality,
        timestamp: manualTimestamp || null,
        declination: null,
        fieldStrength: null,
        isSensor: false,
      };
    }

    return {
      azimuth: pointingState.azimuth,
      altitude: pointingState.altitude,
      cardinal: pointingState.cardinal,
      reference: pointingState.reference,
      quality: pointingState.quality,
      timestamp: pointingState.timestamp,
      declination: pointingState.declination,
      fieldStrength: pointingState.fieldStrength,
      isSensor: true,
    };
  }, [mode, pointingState, manualAzimuth, manualAltitude, manualTimestamp]);

  // Relative target guidance offset
  const targetOffset = useMemo(() => {
    if (!targetPosition) return null;
    let azDiff = targetPosition.azimuth - currentReading.azimuth;
    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    const altDiff = targetPosition.altitude - currentReading.altitude;
    return {
      azDiff,
      altDiff,
      targetAzimuth: targetPosition.azimuth,
      targetAltitude: targetPosition.altitude,
      isAboveHorizon: targetPosition.altitude >= 0,
    };
  }, [targetPosition, currentReading.azimuth, currentReading.altitude]);

  // Manual adjustment handlers
  const handleAdjustAzimuth = useCallback((delta: number) => {
    setManualAzimuth(prev => {
      const next = wrapDegrees(prev + delta);
      setManualAzimuthInput(next.toFixed(1));
      return next;
    });
    setManualTimestamp(Date.now());
  }, []);

  const handleAdjustAltitude = useCallback((delta: number) => {
    setManualAltitude(prev => {
      const next = clampAltitude(prev + delta);
      setManualAltitudeInput(next.toFixed(1));
      return next;
    });
    setManualTimestamp(Date.now());
  }, []);

  const handleManualAzimuthChange = (text: string) => {
    setManualAzimuthInput(text);
    const parsed = parseFloat(text);
    if (Number.isFinite(parsed)) {
      setManualAzimuth(wrapDegrees(parsed));
      setManualTimestamp(Date.now());
    }
  };

  const handleManualAltitudeChange = (text: string) => {
    setManualAltitudeInput(text);
    const parsed = parseFloat(text);
    if (Number.isFinite(parsed)) {
      setManualAltitude(clampAltitude(parsed));
      setManualTimestamp(Date.now());
    }
  };

  // Capture snapshot and navigate to observation editor
  const handleCaptureSnapshot = () => {
    const timestampMs = currentReading.timestamp ?? Date.now();
    const snapshot: InstrumentSnapshot = {
      capturedAt: new Date(timestampMs).toISOString(),
      azimuth: Number(currentReading.azimuth.toFixed(2)),
      altitude: Number(currentReading.altitude.toFixed(2)),
      cardinal: currentReading.cardinal,
      reference: currentReading.reference,
      quality: currentReading.quality,
      source: currentReading.isSensor ? 'sensor' : 'manual',
      declination: currentReading.declination !== null ? Number(currentReading.declination.toFixed(2)) : null,
      fieldStrength: currentReading.fieldStrength !== null ? Number(currentReading.fieldStrength.toFixed(1)) : null,
      targetId: targetId ?? null,
      targetName: targetName ?? null,
    };

    const prefilledNotes = [
      `[Celestial Field Instrument Sighting]`,
      `Bearing: ${snapshot.azimuth}° ${snapshot.cardinal} (${snapshot.reference === 'true' ? 'True North' : snapshot.reference === 'magnetic' ? 'Magnetic North' : 'Manual Reference'})`,
      `Elevation: ${snapshot.altitude >= 0 ? '+' : ''}${snapshot.altitude}° above horizon`,
      `Quality: ${snapshot.quality} (${snapshot.source === 'sensor' ? 'active device sensors' : 'manual sighting'})`,
      snapshot.declination != null ? `Magnetic Declination: ${snapshot.declination >= 0 ? '+' : ''}${snapshot.declination}°` : null,
      snapshot.targetName ? `Aligned Target: ${snapshot.targetName}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    router.push({
      pathname: '/fieldwork/create' as never,
      params: {
        targetId: targetId ?? undefined,
        targetName: targetName ?? undefined,
        prefilledNotes,
        snapshotJson: JSON.stringify(snapshot),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <Header title="Celestial Field Instrument" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.masthead}>
          <Text style={styles.kicker}>ASTRONOMICAL HEADING & INCLINATION · F06</Text>
          <Text accessibilityRole="header" style={styles.title}>Night Sky Field Instrument</Text>
          <Text style={styles.summary}>
            Foreground astronomical direction finder and clinometer for orientation, horizon altitude estimation, and eyepiece sighting.
          </Text>
        </View>

        {/* Solar Safety Warning (Mandatory: never point user at unfiltered Sun) */}
        <View style={[styles.safetyBanner, isSolarTarget && styles.safetyBannerSolar]}>
          <Icon name="alert-triangle" size={18} color={isSolarTarget ? colors.danger : colors.terracotta} />
          <View style={styles.safetyTextCol}>
            <Text style={styles.safetyTitle}>SOLAR OBSERVING SAFETY WARNING</Text>
            <Text style={styles.safetyBody}>
              Never view the Sun directly or point optical viewfinders, binoculars, or telescopes at the Sun without certified solar filtration (ISO 12312-2). Permanent, irreversible retina damage occurs instantaneously.
            </Text>
          </View>
        </View>

        {/* Mode Switcher */}
        <View style={styles.modeRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use device motion and magnetic sensors"
            style={[styles.modePill, mode === 'sensors' && styles.modePillActive]}
            onPress={() => setMode('sensors')}
          >
            <Icon name="compass" size={14} color={mode === 'sensors' ? colors.ivory : colors.forest} />
            <Text style={[styles.modePillText, mode === 'sensors' && styles.modePillTextActive]}>Sensors (Auto)</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to manual direction controls"
            style={[styles.modePill, mode === 'manual' && styles.modePillActive]}
            onPress={() => setMode('manual')}
          >
            <Icon name="sliders" size={14} color={mode === 'manual' ? colors.ivory : colors.forest} />
            <Text style={[styles.modePillText, mode === 'manual' && styles.modePillTextActive]}>Manual Controls</Text>
          </Pressable>
        </View>

        {/* Sensor State Banner */}
        {mode === 'sensors' && (
          <View style={styles.statusBox}>
            <View style={styles.statusRow}>
              <Icon
                name={pointingState.status === 'ready' ? 'check-circle' : 'loader'}
                size={14}
                color={pointingState.status === 'ready' ? colors.forest : colors.brass}
              />
              <Text style={styles.statusLabel}>
                {pointingState.status === 'ready'
                  ? `Sensor tracking active · Reference: ${currentReading.reference.toUpperCase()} NORTH`
                  : pointingState.status === 'calibrating'
                  ? 'Calibrating sensors... Hold device steady away from metals.'
                  : 'Sensors unavailable on this device. Use manual controls below.'}
              </Text>
            </View>
          </View>
        )}

        {/* Forest Instrument Dial Visual Container */}
        <View
          style={styles.instrumentDial}
          accessible
          accessibilityLabel={`Field Instrument reading: Bearing ${currentReading.azimuth.toFixed(1)} degrees ${currentReading.cardinal}, Elevation ${currentReading.altitude >= 0 ? '+' : ''}${currentReading.altitude.toFixed(1)} degrees, Reference: ${currentReading.reference} north`}
        >
          {/* Compass Rose Bezel */}
          <View style={styles.bezelRing}>
            <Text style={[styles.cardinalMark, styles.cardinalN]}>N</Text>
            <Text style={[styles.cardinalMark, styles.cardinalE]}>E</Text>
            <Text style={[styles.cardinalMark, styles.cardinalS]}>S</Text>
            <Text style={[styles.cardinalMark, styles.cardinalW]}>W</Text>

            {/* Inner Heading Display */}
            <View style={styles.dialCenterContent}>
              <Text style={styles.dialCardinal}>{currentReading.cardinal}</Text>
              <Text style={styles.dialAzimuthLarge}>{currentReading.azimuth.toFixed(1)}°</Text>
              <Text style={styles.dialAltitudeSub}>
                {currentReading.altitude >= 0 ? '+' : ''}{currentReading.altitude.toFixed(1)}° Alt
              </Text>

              <View style={styles.dialBadge}>
                <Text style={styles.dialBadgeText}>
                  {currentReading.reference === 'true' ? 'TRUE NORTH' : currentReading.reference === 'magnetic' ? 'MAGNETIC NORTH' : 'MANUAL'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Target Guidance Card (if target is selected) */}
        {targetName && (
          <View style={styles.targetCard}>
            <View style={styles.targetHeaderRow}>
              <Icon name="crosshair" size={15} color={colors.forest} />
              <Text style={styles.targetCardTitle}>Target Tracking: {targetName.toUpperCase()}</Text>
            </View>

            {targetOffset ? (
              <View style={styles.targetDetails}>
                <Text style={styles.targetPositionText}>
                  Calculated Position: Azimuth {targetOffset.targetAzimuth.toFixed(1)}° · Elevation {targetOffset.targetAltitude.toFixed(1)}° ({targetOffset.isAboveHorizon ? 'Above Horizon' : 'Below Horizon'})
                </Text>
                <Text style={styles.targetGuidanceText}>
                  Offset: Turn {Math.abs(targetOffset.azDiff).toFixed(1)}° {targetOffset.azDiff > 0 ? 'Right (Clockwise)' : 'Left (Counter-Clockwise)'}, Tilt {Math.abs(targetOffset.altDiff).toFixed(1)}° {targetOffset.altDiff > 0 ? 'Higher' : 'Lower'}.
                </Text>
              </View>
            ) : (
              <Text style={styles.targetUnavailableText}>
                Target ephemeris currently unavailable for active coordinates.
              </Text>
            )}
          </View>
        )}

        {/* Accessible Numeric Measurement Table */}
        <View style={styles.telemetryCard}>
          <Text accessibilityRole="header" style={styles.telemetryHeader}>Scientific Telemetry & Reference</Text>

          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Azimuth (Horizontal Bearing):</Text>
            <Text style={styles.telemetryValue}>{currentReading.azimuth.toFixed(2)}° ({currentReading.cardinal})</Text>
          </View>

          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Elevation (Inclination Angle):</Text>
            <Text style={styles.telemetryValue}>{currentReading.altitude >= 0 ? '+' : ''}{currentReading.altitude.toFixed(2)}°</Text>
          </View>

          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Reference Coordinate Frame:</Text>
            <Text style={styles.telemetryValue}>
              {currentReading.reference === 'true'
                ? `True North (Declination: ${currentReading.declination !== null && currentReading.declination >= 0 ? '+' : ''}${currentReading.declination?.toFixed(1)}°)`
                : currentReading.reference === 'magnetic'
                ? 'Magnetic North (Uncorrected)'
                : 'Manual Reference'}
            </Text>
          </View>

          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Sensor Quality & State:</Text>
            <Text style={styles.telemetryValue}>{currentReading.quality.toUpperCase()}</Text>
          </View>

          {currentReading.fieldStrength !== null && (
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Local Magnetic Field Strength:</Text>
              <Text style={styles.telemetryValue}>{currentReading.fieldStrength.toFixed(1)} µT (Normal: 25–65 µT)</Text>
            </View>
          )}

          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Sample Timestamp:</Text>
            <Text style={styles.telemetryValue}>
              {currentReading.timestamp ? new Date(currentReading.timestamp).toLocaleTimeString() : 'Manual alignment'}
            </Text>
          </View>
        </View>

        {/* Manual Adjustments Section (when in manual mode) */}
        {mode === 'manual' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.manualControlsBox}>
            <Text accessibilityRole="header" style={styles.manualControlsTitle}>Manual Sighting Controls</Text>
            <Text style={styles.manualControlsBody}>
              Manually enter or adjust bearing and elevation for fixed telescope mounts or uncalibrated conditions.
            </Text>

            <View style={styles.stepperGroup}>
              <Text style={styles.stepperLabel}>Azimuth Adjustment (0° to 360°):</Text>
              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease azimuth by 15 degrees"
                  style={styles.stepBtn}
                  onPress={() => handleAdjustAzimuth(-15)}
                >
                  <Text style={styles.stepBtnText}>-15°</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease azimuth by 5 degrees"
                  style={styles.stepBtn}
                  onPress={() => handleAdjustAzimuth(-5)}
                >
                  <Text style={styles.stepBtnText}>-5°</Text>
                </Pressable>
                <TextInput
                  accessibilityLabel="Manual azimuth numeric input"
                  value={manualAzimuthInput}
                  onChangeText={handleManualAzimuthChange}
                  keyboardType="numeric"
                  style={styles.manualInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase azimuth by 5 degrees"
                  style={styles.stepBtn}
                  onPress={() => handleAdjustAzimuth(5)}
                >
                  <Text style={styles.stepBtnText}>+5°</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase azimuth by 15 degrees"
                  style={styles.stepBtn}
                  onPress={() => handleAdjustAzimuth(15)}
                >
                  <Text style={styles.stepBtnText}>+15°</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.stepperGroup}>
              <Text style={styles.stepperLabel}>Elevation Adjustment (-90° to +90°):</Text>
              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease elevation by 10 degrees"
                  style={styles.stepBtn}
                  onPress={() => handleAdjustAltitude(-10)}
                >
                  <Text style={styles.stepBtnText}>-10°</Text>
                </Pressable>
                <TextInput
                  accessibilityLabel="Manual elevation numeric input"
                  value={manualAltitudeInput}
                  onChangeText={handleManualAltitudeChange}
                  keyboardType="numeric"
                  style={styles.manualInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase elevation by 10 degrees"
                  style={styles.stepBtn}
                  onPress={() => handleAdjustAltitude(10)}
                >
                  <Text style={styles.stepBtnText}>+10°</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Capture Snapshot CTA Button */}
        <View style={styles.ctaBox}>
          <Button
            title="Capture snapshot for observation"
            icon="camera"
            variant="primary"
            accessibilityLabel="Capture current instrument reading into a new observation log"
            onPress={handleCaptureSnapshot}
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
  },
  masthead: {
    marginBottom: spacing[3],
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
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.sageLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.terracotta,
    borderRadius: radii.sm,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  safetyBannerSolar: {
    backgroundColor: '#FDECE8',
    borderLeftColor: colors.danger,
  },
  safetyTextCol: {
    flex: 1,
  },
  safetyTitle: {
    ...typography.label,
    color: colors.danger,
    marginBottom: 2,
  },
  safetyBody: {
    ...typography.bodySmall,
    color: colors.ink,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing[2],
    minHeight: layout.minimumTouchTarget,
    borderWidth: 1,
    borderColor: colors.forest,
    borderRadius: radii.pill,
    backgroundColor: colors.ivory,
  },
  modePillActive: {
    backgroundColor: colors.forest,
  },
  modePillText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.forest,
  },
  modePillTextActive: {
    color: colors.ivory,
  },
  statusBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing[2],
    marginBottom: spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    ...typography.meta,
    color: colors.forest,
    flex: 1,
  },
  instrumentDial: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[3],
  },
  bezelRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.forest,
    borderWidth: 6,
    borderColor: colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardinalMark: {
    position: 'absolute',
    ...typography.h2,
    fontWeight: '700',
    color: colors.brass,
  },
  cardinalN: { top: 12 },
  cardinalS: { bottom: 12 },
  cardinalE: { right: 16 },
  cardinalW: { left: 16 },
  dialCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialCardinal: {
    ...typography.label,
    fontSize: 14,
    color: colors.brass,
    letterSpacing: 2,
  },
  dialAzimuthLarge: {
    ...typography.display,
    fontSize: 40,
    lineHeight: 46,
    color: colors.ivory,
    fontWeight: '700',
    marginVertical: 2,
  },
  dialAltitudeSub: {
    ...typography.h2,
    fontSize: 18,
    color: colors.sage,
  },
  dialBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  dialBadgeText: {
    ...typography.label,
    fontSize: 9,
    color: colors.ivory,
    letterSpacing: 1,
  },
  targetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  targetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  targetCardTitle: {
    ...typography.label,
    color: colors.forest,
  },
  targetDetails: {
    marginTop: 4,
  },
  targetPositionText: {
    ...typography.bodySmall,
    color: colors.ink,
    fontWeight: '500',
  },
  targetGuidanceText: {
    ...typography.meta,
    color: colors.terracotta,
    marginTop: 2,
  },
  targetUnavailableText: {
    ...typography.meta,
    color: colors.muted,
  },
  telemetryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  telemetryHeader: {
    ...typography.h2,
    color: colors.forest,
    marginBottom: spacing[2],
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  telemetryLabel: {
    ...typography.bodySmall,
    color: colors.muted,
    flex: 1,
  },
  telemetryValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'right',
  },
  manualControlsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  manualControlsTitle: {
    ...typography.h2,
    color: colors.forest,
    marginBottom: 2,
  },
  manualControlsBody: {
    ...typography.bodySmall,
    color: colors.muted,
    marginBottom: spacing[3],
  },
  stepperGroup: {
    marginBottom: spacing[3],
  },
  stepperLabel: {
    ...typography.meta,
    color: colors.ink,
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  stepBtn: {
    flex: 1,
    minHeight: layout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
  stepBtnText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.forest,
  },
  manualInput: {
    flex: 1.5,
    minHeight: layout.minimumTouchTarget,
    backgroundColor: colors.ivory,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    textAlign: 'center',
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  ctaBox: {
    marginTop: spacing[2],
  },
});
