import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { formatEditorialDate } from '../../utils/text';
import { Icon } from './Icon';

export interface OfflineBannerProps {
  lastSyncedAt?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  lastSyncedAt,
  onRetry,
  isRetrying = false,
}) => {
  const syncTime = lastSyncedAt
    ? `Last synchronized: ${formatEditorialDate(lastSyncedAt)} at ${new Date(
        lastSyncedAt
      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'No live telemetry recorded yet';

  return (
    <View style={styles.bannerContainer} accessibilityRole="alert">
      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Icon name="wifi-off" size={16} color={colors.forest} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.titleText}>Offline Field Mode</Text>
          <Text style={styles.subtitleText}>{syncTime}</Text>
        </View>

        {Boolean(onRetry) && (
          <Pressable
            onPress={onRetry}
            disabled={isRetrying}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Retry connection and refresh feed"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.retryButtonText}>
              {isRetrying ? 'Syncing...' : 'Retry'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: colors.sageLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.sage,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  textContainer: {
    flex: 1,
    marginRight: spacing[2],
  },
  titleText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
    fontWeight: '700',
  },
  subtitleText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
});

export default OfflineBanner;
