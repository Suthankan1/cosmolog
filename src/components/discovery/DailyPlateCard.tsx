import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { DiscoveryItem } from '../../database/models';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { formatEditorialDate } from '../../utils/text';
import { FavouriteButton } from '../common/FavouriteButton';
import { Icon } from '../common/Icon';

export interface DailyPlateCardProps {
  item: DiscoveryItem;
  isSaved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

export const DailyPlateCard: React.FC<DailyPlateCardProps> = ({
  item,
  isSaved,
  onPress,
  onToggleSave,
}) => {
  const imageSource = item.imageLocalUri ? { uri: item.imageLocalUri } : item.imageRemoteUrl ? { uri: item.imageRemoteUrl } : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Featured Daily Plate: ${item.title}`}
    >
      <View style={styles.imageWrapper}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            accessibilityLabel={item.title}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Icon name="sun" size={48} color={colors.brass} />
          </View>
        )}

        <View style={styles.gradientOverlay} />

        <View style={styles.topBadgeRow}>
          <View style={styles.plateBadge}>
            <Text style={styles.plateBadgeText}>THE DAILY PLATE</Text>
          </View>

          <View style={styles.favouriteWrapper}>
            <FavouriteButton
              isSaved={isSaved}
              onToggle={onToggleSave}
              activeColor={colors.terracotta}
              inactiveColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.bottomContent}>
          <Text style={styles.dateText}>{formatEditorialDate(item.publishedAt)}</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.provenanceRow}>
            <Icon name="award" size={12} color={colors.brass} style={styles.provenanceIcon} />
            <Text style={styles.creditText} numberOfLines={1}>
              {item.attribution || 'NASA / APOD'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.forestDark,
    marginBottom: spacing[6],
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  imageWrapper: {
    height: 245,
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  imageFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.forestDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16, 47, 38, 0.45)',
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    zIndex: 2,
  },
  plateBadge: {
    backgroundColor: colors.forest,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brass,
  },
  plateBadgeText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.ivory,
    fontWeight: '700',
    letterSpacing: 1,
  },
  favouriteWrapper: {
    backgroundColor: 'rgba(24, 66, 53, 0.7)',
    borderRadius: radii.pill,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContent: {
    padding: spacing[4],
    zIndex: 2,
  },
  dateText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.brass,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    lineHeight: 26,
    color: colors.white,
    marginBottom: 6,
  },
  provenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  provenanceIcon: {
    marginRight: 4,
  },
  creditText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.ivory,
    opacity: 0.85,
    flex: 1,
  },
});

export default DailyPlateCard;
