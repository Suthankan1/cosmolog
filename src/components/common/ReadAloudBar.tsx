/**
 * ReadAloudBar Component (F11)
 *
 * Accessible playback bar for reading articles, dispatches, and study texts aloud.
 * Features:
 * - Play / Pause / Resume / Stop actions.
 * - Speech rate cycling (1.0x -> 1.25x -> 1.5x -> 0.8x).
 * - Real-time sentence chunk progress.
 * - Clear disclosure of iOS silent switch behavior and publisher summary limits.
 * - Always provides visible text fallback.
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useReadAloud } from '../../hooks/useReadAloud';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { Icon } from './Icon';

interface ReadAloudBarProps {
  title: string;
  textToRead: string;
  /** Explicit descriptor of content boundaries, e.g. "Available publisher summary" */
  contentScopeLabel?: string;
  style?: object;
}

const RATES = [1.0, 1.25, 1.5, 0.8];

export function ReadAloudBar({
  title,
  textToRead,
  contentScopeLabel = 'Available article text',
  style,
}: ReadAloudBarProps) {
  const {
    isSpeaking,
    isPaused,
    isBusy,
    rate,
    currentChunkIndex,
    totalChunks,
    togglePlayPause,
    stop,
    setRate,
  } = useReadAloud(true);

  const [showCaveat, setShowCaveat] = useState(false);

  const handleCycleRate = () => {
    const currentIndex = RATES.indexOf(rate);
    const nextIndex = (currentIndex + 1) % RATES.length;
    setRate(RATES[nextIndex]);
  };

  const getPlayButtonTitle = () => {
    if (isSpeaking) return 'Pause';
    if (isPaused) return 'Resume';
    return 'Read aloud';
  };

  const getPlayButtonIcon = () => {
    if (isSpeaking) return 'pause' as const;
    return 'play' as const;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Icon name="volume-2" size={14} color={colors.forest} />
          <Text style={styles.badgeText}>READ ALOUD · F11</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle audio caveats and device settings information"
          style={styles.infoToggle}
          onPress={() => setShowCaveat(prev => !prev)}
        >
          <Icon name="info" size={14} color={colors.muted} />
          <Text style={styles.infoToggleText}>{showCaveat ? 'Hide advice' : 'Audio guidance'}</Text>
        </Pressable>
      </View>

      {showCaveat && (
        <View style={styles.caveatContainer}>
          <Text style={styles.caveatHeading}>Platform Audio Guidance</Text>
          <Text style={styles.caveatBody}>
            • <Text style={styles.boldText}>iOS Silent Switch:</Text> Ensure your device’s physical Ring/Silent switch is set to ring so speech synthesis is not muted.
          </Text>
          <Text style={styles.caveatBody}>
            • <Text style={styles.boldText}>Content Scope:</Text> Reading {contentScopeLabel.toLowerCase()} only; original online links provide full publisher articles where restricted.
          </Text>
          <Text style={styles.caveatBody}>
            • <Text style={styles.boldText}>Offline Support:</Text> Synthesis uses on-device OS voices where installed; some voices may require network connectivity.
          </Text>
        </View>
      )}

      <View style={styles.controlsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${getPlayButtonTitle()} narration for ${title}`}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => void togglePlayPause(title, textToRead)}
        >
          <Icon name={getPlayButtonIcon()} size={16} color={colors.ivory} />
          <Text style={styles.primaryButtonText}>{getPlayButtonTitle()}</Text>
        </Pressable>

        {isBusy && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop read aloud narration"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => void stop()}
          >
            <Icon name="square" size={14} color={colors.terracotta} />
            <Text style={styles.stopButtonText}>Stop</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Speech rate: ${rate}x. Tap to change.`}
          style={({ pressed }) => [
            styles.rateButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleCycleRate}
        >
          <Text style={styles.rateButtonText}>{`${rate}x`}</Text>
        </Pressable>
      </View>

      {isBusy && totalChunks > 0 && (
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Reading section {Math.min(currentChunkIndex + 1, totalChunks)} of {totalChunks}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    marginVertical: spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  badgeText: {
    ...typography.label,
    fontSize: 10,
    color: colors.forest,
    fontWeight: '700',
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing[1],
    minHeight: 44,
  },
  infoToggleText: {
    ...typography.meta,
    fontSize: 11,
    color: colors.muted,
  },
  caveatContainer: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.sm,
    padding: spacing[2],
    marginBottom: spacing[3],
    gap: 4,
  },
  caveatHeading: {
    ...typography.label,
    fontSize: 10,
    color: colors.forest,
    fontWeight: '700',
    marginBottom: 2,
  },
  caveatBody: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.forest,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    minHeight: 48,
    minWidth: 120,
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.label,
    fontSize: 13,
    color: colors.ivory,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.terracotta,
    backgroundColor: '#F9ECE8',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  stopButtonText: {
    ...typography.label,
    fontSize: 12,
    color: colors.terracotta,
    fontWeight: '700',
  },
  rateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButtonText: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  progressRow: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressText: {
    ...typography.meta,
    color: colors.brass,
    fontWeight: '600',
  },
});
