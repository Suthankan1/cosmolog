import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DiscoveryItem } from '../../database/models';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { formatEditorialDate } from '../../utils/text';
import { FavouriteButton } from '../common/FavouriteButton';
import { Icon } from '../common/Icon';
import { DiscoveryImage } from './DiscoveryImage';

export interface DailyPlateCardProps {
  item: DiscoveryItem;
  isSaved: boolean;
  pending?: boolean;
  offline?: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

export function DailyPlateCard({ item, isSaved, pending, offline, onPress, onToggleSave }: DailyPlateCardProps) {
  return (
    <View style={styles.card}>
      <Pressable style={({ pressed }) => [styles.open, pressed && styles.pressed]} onPress={onPress}
        accessibilityRole="button" accessibilityLabel={'Daily Plate, ' + item.title} testID="daily-plate">
        <DiscoveryImage item={item} offline={offline} style={styles.photo} />
        <View style={styles.caption}>
          <View style={styles.captionText}>
            <Text style={styles.date}>Daily Plate · {formatEditorialDate(item.publishedAt)}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </View>
          <View style={styles.arrow}><Icon name="arrow-right" size={19} color={colors.forestDark} /></View>
        </View>
      </Pressable>
      <View style={styles.bookmark}>
        <FavouriteButton isSaved={isSaved} pending={pending} onToggle={onToggleSave} inactiveColor={colors.forest} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.forestDark, borderRadius: radii.xl, overflow: 'hidden' },
  open: { minHeight: 48 },
  pressed: { opacity: 0.88 },
  photo: { width: '100%', aspectRatio: 1.95 },
  caption: { padding: spacing[4], gap: spacing[3], flexDirection: 'row', alignItems: 'center' },
  captionText: { flex: 1 },
  date: { ...typography.label, color: colors.brass, marginBottom: spacing[1] },
  title: { ...typography.h2, color: colors.ivory },
  arrow: { width: 36, height: 36, backgroundColor: colors.brass, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  bookmark: { position: 'absolute', right: spacing[3], top: spacing[3], borderRadius: radii.pill, backgroundColor: colors.surface },
});
