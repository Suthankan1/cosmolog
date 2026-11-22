import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DiscoveryItem } from '../../database/models';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { formatEditorialDate } from '../../utils/text';
import { FavouriteButton } from '../common/FavouriteButton';
import { DiscoveryImage } from './DiscoveryImage';

export interface DispatchRowProps {
  item: DiscoveryItem;
  isSaved: boolean;
  pending?: boolean;
  offline?: boolean;
  notePreview?: string | null;
  availability?: string;
  onPress: () => void;
  onToggleSave: () => void;
}

export function DispatchRow({
  item, isSaved, pending, offline, notePreview, availability, onPress, onToggleSave,
}: DispatchRowProps) {
  const publisher = item.source === 'nasa-apod' ? 'NASA APOD' : item.attribution || 'Spaceflight News';
  return (
    <View style={styles.row}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.open, pressed && styles.pressed]}
        accessibilityRole="button">
        <DiscoveryImage item={item} offline={offline} style={styles.thumbnail} />
        <View style={styles.copy}>
          <Text style={styles.meta}>{publisher} · {formatEditorialDate(item.publishedAt)}</Text>
          <Text style={styles.title}>{item.title}</Text>
          {availability && <Text style={styles.availability}>{availability}</Text>}
          {notePreview ? <Text style={styles.summary} numberOfLines={2}>{notePreview}</Text>
            : !availability && item.summary ? <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text> : null}
        </View>
      </Pressable>
      <FavouriteButton
        isSaved={isSaved} pending={pending} onToggle={onToggleSave}
        accessibilityLabel={(isSaved ? 'Remove ' : 'Save ') + item.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border },
  open: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing[3], gap: spacing[3] },
  pressed: { opacity: 0.75 },
  thumbnail: { width: 64, height: 64, borderRadius: radii.md },
  copy: { flex: 1, gap: spacing[1] },
  meta: { ...typography.bodySmall, color: colors.muted },
  title: { fontFamily: typography.h2.fontFamily, fontSize: 18, lineHeight: 24, color: colors.ink },
  summary: { ...typography.bodySmall, color: colors.muted },
  availability: { ...typography.bodySmall, color: colors.forest },
});
