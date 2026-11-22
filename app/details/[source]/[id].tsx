import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useAppDispatch, useAppSelector } from '../../../src/store';
import { toggleFavouriteThunk } from '../../../src/store/slices/favouritesSlice';
import { getDiscoveryItemById, upsertDiscoveryItems } from '../../../src/database/repositories/discoveryRepository';
import { fetchNasaApodItem } from '../../../src/services/api/nasaApodService';
import { fetchSpaceflightNewsItem } from '../../../src/services/api/spaceflightNewsService';
import { parseDetailsParams } from '../../../src/navigation/types';
import { DiscoveryItem } from '../../../src/database/models';
import { colors, layout, radii, spacing, typography } from '../../../src/theme/tokens';
import { formatEditorialDate } from '../../../src/utils/text';
import { Header } from '../../../src/components/common/Header';
import { FavouriteButton } from '../../../src/components/common/FavouriteButton';
import { Button } from '../../../src/components/common/Button';
import { Icon } from '../../../src/components/common/Icon';
import { EmptyState } from '../../../src/components/common/EmptyState';

export default function DetailsScreen() {
  const rawParams = useLocalSearchParams<{ source?: string; id?: string }>();
  const dispatch = useAppDispatch();
  const { favouriteMap } = useAppSelector((state) => state.favourites);

  const [item, setItem] = useState<DiscoveryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(
    () => parseDetailsParams({ source: rawParams.source, id: rawParams.id }),
    [rawParams.source, rawParams.id]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadItemDetails() {
      if (!parsed) {
        setError('Invalid discovery route parameters.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const localId = `${parsed.source}:${parsed.id}`;

      // 1. Read directly from durable SQLite cache first
      try {
        const cached = await getDiscoveryItemById(localId);
        if (cached && isMounted) {
          setItem(cached);
          setIsLoading(false);
          return;
        }
      } catch {}

      // 2. If not found in cache, fetch from remote source
      try {
        let fetched: DiscoveryItem | null = null;
        if (parsed.source === 'nasa-apod') {
          fetched = await fetchNasaApodItem(parsed.id);
        } else {
          fetched = await fetchSpaceflightNewsItem(parsed.id);
        }

        if (fetched && isMounted) {
          await upsertDiscoveryItems([fetched]);
          setItem(fetched);
        } else if (isMounted) {
          setError('Discovery record could not be found.');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch details');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadItemDetails();

    return () => {
      isMounted = false;
    };
  }, [parsed]);

  const isSaved = item ? Boolean(favouriteMap[item.localId]) : false;

  const handleToggleSave = () => {
    if (item) {
      dispatch(toggleFavouriteThunk(item));
    }
  };

  const openCanonicalLink = () => {
    if (item?.canonicalUrl) {
      Linking.openURL(item.canonicalUrl).catch(() => {});
    }
  };

  if (!parsed || error) {
    return (
      <View style={styles.container}>
        <Header title="Discovery Record" showBack />
        <EmptyState
          icon="alert-circle"
          title="Observation Not Found"
          description={error || 'Unable to resolve discovery parameters.'}
        />
      </View>
    );
  }

  if (isLoading && !item) {
    return (
      <View style={styles.container}>
        <Header title="Discovery Record" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.forest} />
          <Text style={styles.loadingText}>Reading observation archives...</Text>
        </View>
      </View>
    );
  }

  if (!item) return null;

  const imageSource = item.imageLocalUri
    ? { uri: item.imageLocalUri }
    : item.imageRemoteUrl
    ? { uri: item.imageRemoteUrl }
    : null;

  return (
    <View style={styles.container}>
      <Header
        title={item.source === 'nasa-apod' ? 'Daily Plate' : 'Space Dispatch'}
        subtitle={formatEditorialDate(item.publishedAt)}
        showBack
        rightElement={
          <FavouriteButton
            isSaved={isSaved}
            onToggle={handleToggleSave}
            size={22}
            activeColor={colors.terracotta}
            inactiveColor={colors.forest}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {imageSource ? (
          <View style={styles.heroImageWrapper}>
            <Image
              source={imageSource}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
              accessibilityLabel={item.title}
            />
          </View>
        ) : (
          <View style={styles.fallbackHero}>
            <Icon name="compass" size={48} color={colors.forest} />
          </View>
        )}

        <View style={styles.provenancePillRow}>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>{item.attribution || 'NASA / APOD'}</Text>
          </View>

          {item.imageLocalUri && (
            <View style={styles.offlineAvailableBadge}>
              <Icon name="check" size={12} color={colors.forest} style={styles.badgeIcon} />
              <Text style={styles.offlineBadgeText}>Offline Preserved</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.metadataBox}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Published</Text>
            <Text style={styles.metaValue}>{formatEditorialDate(item.publishedAt)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Curator / Source</Text>
            <Text style={styles.metaValue}>{item.author || item.attribution || 'NASA'}</Text>
          </View>
        </View>

        <Text style={styles.bodySectionHeader}>Observation Notes</Text>
        <Text style={styles.bodyText}>{item.body}</Text>

        <View style={styles.attributionCard}>
          <Text style={styles.attributionTitle}>Provenance & Credit</Text>
          <Text style={styles.attributionText}>
            Credit: {item.attribution || 'NASA Science Data / Public Science Feeds'}
          </Text>

          {Boolean(item.canonicalUrl) && (
            <Button
              title="Open Canonical Source"
              onPress={openCanonicalLink}
              variant="outline"
              icon="external-link"
              style={styles.canonicalButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scrollContent: {
    paddingHorizontal: layout.horizontalInset,
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  heroImageWrapper: {
    height: 260,
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.forestDark,
    marginBottom: spacing[5],
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  fallbackHero: {
    height: 180,
    width: '100%',
    borderRadius: radii.xl,
    backgroundColor: colors.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  provenancePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sourceBadge: {
    backgroundColor: colors.sageLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  sourceBadgeText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.forest,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  offlineAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF3EC',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.sage,
  },
  badgeIcon: {
    marginRight: 4,
  },
  offlineBadgeText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.forest,
    fontWeight: '600',
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 26,
    lineHeight: 34,
    color: colors.forest,
    marginBottom: spacing[4],
  },
  metadataBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[6],
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
  },
  bodySectionHeader: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.forest,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  bodyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    lineHeight: 24,
    color: colors.ink,
    marginBottom: spacing[6],
  },
  attributionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
  },
  attributionTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.forest,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing[2],
  },
  attributionText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginBottom: spacing[4],
  },
  canonicalButton: {
    marginTop: spacing[1],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing[3],
  },
});
