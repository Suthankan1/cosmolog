import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radii, spacing, typography } from '../../theme/tokens';
import { formatSyncTimestamp } from '../../utils/text';
import { Icon } from './Icon';

export interface OfflineBannerProps {
  lastSyncedAt?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function OfflineBanner({ lastSyncedAt, onRetry, isRetrying = false }: OfflineBannerProps) {
  return (
    <View style={styles.banner}>
      <Icon name="wifi-off" size={20} color={colors.forest} />
      <View style={styles.copy} accessibilityLiveRegion="polite">
        <Text style={styles.title}>You’re offline</Text>
        <Text style={styles.subtitle}>{lastSyncedAt
          ? 'Last source update · ' + formatSyncTimestamp(lastSyncedAt)
          : 'Connect to receive source updates.'}</Text>
      </View>
      {onRetry && (
        <Pressable accessibilityRole="button" accessibilityLabel="Retry connection and refresh feed" onPress={onRetry}
          disabled={isRetrying} accessibilityState={{ busy: isRetrying, disabled: isRetrying }} style={styles.retry}>
          <Text style={styles.title}>{isRetrying ? 'Syncing…' : 'Retry'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.sageLight, borderRadius: radii.md, marginHorizontal: layout.horizontalInset,
    marginVertical: spacing[2], padding: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3],
  },
  copy: { flex: 1 },
  title: { ...typography.label, fontSize: 14, lineHeight: 20, color: colors.forest },
  subtitle: { ...typography.bodySmall, color: colors.forest },
  retry: { minHeight: layout.minimumTouchTarget, minWidth: layout.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
});
