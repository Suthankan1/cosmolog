import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  loadCachedFeedThunk,
  setIsOffline,
  setSelectedCategory,
  syncRemoteFeedThunk,
} from '../../src/store/slices/feedSlice';
import {
  loadFavouritesThunk,
  toggleFavouriteThunk,
} from '../../src/store/slices/favouritesSlice';
import { subscribeToNetworkState } from '../../src/services/network/networkObserver';
import { navigateToDetails } from '../../src/navigation/types';
import { colors, layout, spacing, typography } from '../../src/theme/tokens';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { DailyPlateCard } from '../../src/components/discovery/DailyPlateCard';
import { DispatchRow } from '../../src/components/discovery/DispatchRow';
import { CategoryChips } from '../../src/components/discovery/CategoryChips';
import { EmptyState } from '../../src/components/common/EmptyState';
import { DiscoveryItem } from '../../src/database/models';

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {
    items,
    dailyPlate,
    dispatches,
    selectedCategory,
    isLoading,
    isRefreshing,
    isOffline,
    lastSyncedAt,
    error,
  } = useAppSelector((state) => state.feed);

  const { favouriteMap } = useAppSelector((state) => state.favourites);

  // Initial load: render durable SQLite cache first
  useEffect(() => {
    dispatch(loadCachedFeedThunk());
    dispatch(loadFavouritesThunk());
    dispatch(syncRemoteFeedThunk());

    // Listen to network transitions: automatically refresh when reconnecting
    const unsubscribe = subscribeToNetworkState((isOnline) => {
      dispatch(setIsOffline(!isOnline));
      if (isOnline) {
        dispatch(syncRemoteFeedThunk());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(syncRemoteFeedThunk());
  };

  const filteredDispatches = useMemo(() => {
    if (selectedCategory === 'all') return dispatches;
    if (selectedCategory === 'nasa-apod') {
      return items.filter((i) => i.source === 'nasa-apod');
    }
    return dispatches.filter((i) => i.source === 'spaceflight-news');
  }, [items, dispatches, selectedCategory]);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.brandTitleRow}>
        <View>
          <Text style={styles.brandTitle}>COSMOLOG</Text>
          <Text style={styles.brandSubtitle}>A pocket archive of the universe</Text>
        </View>
      </View>

      {Boolean(dailyPlate) && (
        <DailyPlateCard
          item={dailyPlate!}
          isSaved={Boolean(favouriteMap[dailyPlate!.localId])}
          onPress={() => navigateToDetails(router, dailyPlate!.source, dailyPlate!.externalId)}
          onToggleSave={() => dispatch(toggleFavouriteThunk(dailyPlate!))}
        />
      )}

      <View style={styles.sectionDividerRow}>
        <Text style={styles.sectionHeading}>Space Dispatches</Text>
      </View>

      <CategoryChips
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => dispatch(setSelectedCategory(cat))}
      />

      {Boolean(error) && (
        <View style={styles.errorNotice} accessibilityRole="alert">
          <Text style={styles.errorNoticeText}>
            Unable to update feeds: {error}. Showing saved observations.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.screenContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      {isOffline && (
        <OfflineBanner
          lastSyncedAt={lastSyncedAt}
          onRetry={onRefresh}
          isRetrying={isRefreshing}
        />
      )}

      {isLoading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.forest} />
          <Text style={styles.loadingText}>Opening celestial archives...</Text>
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="cloud-off"
          title="No Local Observations Yet"
          description={
            isOffline
              ? 'You are offline on first launch. Connect to the internet once to download your initial space archive.'
              : 'Unable to reach science telemetry. Tap retry to attempt connecting.'
          }
          actionTitle="Retry Connection"
          onAction={onRefresh}
          loading={isRefreshing}
        />
      ) : (
        <FlatList
          data={filteredDispatches}
          keyExtractor={(item) => item.localId}
          renderItem={({ item }: { item: DiscoveryItem }) => (
            <DispatchRow
              item={item}
              isSaved={Boolean(favouriteMap[item.localId])}
              onPress={() => navigateToDetails(router, item.source, item.externalId)}
              onToggleSave={() => dispatch(toggleFavouriteThunk(item))}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.forest}
              colors={[colors.forest, colors.brass]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  listContent: {
    paddingHorizontal: layout.horizontalInset,
    paddingBottom: spacing[8],
  },
  listHeader: {
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  brandTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  brandTitle: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    color: colors.forest,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  sectionDividerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  sectionHeading: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  },
  errorNotice: {
    backgroundColor: '#FDF3EB',
    borderRadius: 8,
    padding: spacing[3],
    marginVertical: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
  },
  errorNoticeText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.ink,
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
