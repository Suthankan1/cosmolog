import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { DiscoveryItem } from '../../database/models';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { formatEditorialDate } from '../../utils/text';
import { FavouriteButton } from '../common/FavouriteButton';
import { Icon } from '../common/Icon';

export interface DispatchRowProps {
  item: DiscoveryItem;
  isSaved: boolean;
  pending?: boolean;
  offline?: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

export const DispatchRow: React.FC<DispatchRowProps> = ({
  item,
  isSaved,
  pending,
  offline,
  onPress,
  onToggleSave,
}) => {
  const imageSource = item.imageLocalUri
    ? { uri: item.imageLocalUri }
    : !offline && item.imageRemoteUrl
    ? { uri: item.imageRemoteUrl }
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.rowContainer, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Dispatch: ${item.title}`}
    >
      <View style={styles.thumbnailWrapper}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
            accessibilityLabel={item.title}
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Icon name="file-text" size={24} color={colors.forest} />
          </View>
        )}
      </View>

      <View style={styles.contentColumn}>
        <View style={styles.provenanceRow}>
          <Text style={styles.sourceBadge}>{item.attribution || 'Space Dispatch'}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.dateText}>{formatEditorialDate(item.publishedAt)}</Text>
        </View>

        <Text style={styles.titleText} numberOfLines={2}>
          {item.title}
        </Text>
      </View>

      <View style={styles.actionColumn}>
        <FavouriteButton
          isSaved={isSaved}
            pending={pending}
          onToggle={onToggleSave}
          size={18}
          activeColor={colors.terracotta}
          inactiveColor={colors.muted}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 84,
  },
  rowPressed: {
    backgroundColor: '#FAF5EC',
  },
  thumbnailWrapper: {
    width: 68,
    height: 68,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.sageLight,
    marginRight: spacing[3],
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.sageLight,
  },
  contentColumn: {
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  provenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceBadge: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.forest,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaDot: {
    marginHorizontal: 4,
    color: colors.muted,
    fontSize: 10,
  },
  dateText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 10,
    color: colors.muted,
  },
  titleText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink,
  },
  actionColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DispatchRow;
