import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { setSearchQuery, setSelectedCategory } from '../../src/store/slices/feedSlice';
import { useToggleFavourite } from '../../src/features/journal/useToggleFavourite';
import { refreshArchive } from '../../src/store/archiveLifecycle';
import { selectFeed } from '../../src/features/discovery/selectFeed';
import { navigateToDetails } from '../../src/navigation/types';
import { colors, layout, spacing, typography } from '../../src/theme/tokens';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { DailyPlateCard } from '../../src/components/discovery/DailyPlateCard';
import { DispatchRow } from '../../src/components/discovery/DispatchRow';
import { CategoryChips } from '../../src/components/discovery/CategoryChips';
import { SearchBar } from '../../src/components/discovery/SearchBar';
import { EmptyState } from '../../src/components/common/EmptyState';
import { Button } from '../../src/components/common/Button';

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const toggleFavourite = useToggleFavourite();
  const { items, selectedCategory, searchQuery, cacheStatus, connection, metadata, legacySyncedAt, isRefreshing, refreshError } =
    useAppSelector(state => state.feed);
  const { favourites, pending, error: saveError } = useAppSelector(state => state.favourites);
  const savedItems = useMemo(() => new Map(favourites.map(item => [item.localId, item])), [favourites]);
  const { hero, rows } = useMemo(() => selectFeed(items, selectedCategory, searchQuery), [items, selectedCategory, searchQuery]);
  const refresh = () => { void dispatch(refreshArchive()); };
  const offline = connection === 'offline';
  const updatedAt = [metadata['nasa-apod'].lastSyncedAt, metadata['spaceflight-news'].lastSyncedAt]
    .filter((value): value is string => Boolean(value)).sort().at(-1) ?? legacySyncedAt;
  const failedSources = [
    metadata['nasa-apod'].error ? 'Daily Plate' : null,
    metadata['spaceflight-news'].error ? 'Space Dispatches' : null,
  ].filter(Boolean).join(' and ');
  const busy = cacheStatus === 'idle' || cacheStatus === 'loading' || (isRefreshing && !items.length);

  const cardProps = (item: typeof items[number]) => ({
    item: savedItems.get(item.localId) ?? item,
    isSaved: savedItems.has(item.localId),
    pending: Boolean(pending[item.localId]),
    offline,
    onPress: () => navigateToDetails(router, item.source, item.externalId),
    onToggleSave: () => toggleFavourite(item.localId),
  });

  const header = (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>Discover</Text>
      <Text style={styles.subtitle}>Astronomy and spaceflight, collected for reading anywhere.</Text>
      <SearchBar value={searchQuery} onChangeText={value => dispatch(setSearchQuery(value))} onClear={() => dispatch(setSearchQuery(''))} />
      {(!offline && (failedSources || refreshError || cacheStatus === 'error')) ? (
        <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.noticeText}>
            {failedSources ? 'Could not refresh ' + failedSources + '.' : 'Could not read or refresh the archive.'}
            {items.length ? ' Showing the cached collection.' : ''}
          </Text>
          <Button title="Try again" onPress={refresh} variant="outline" loading={isRefreshing} />
        </View>
      ) : null}
      {saveError ? <Text accessibilityRole="alert" style={styles.noticeText}>{saveError}</Text> : null}
      {isRefreshing && items.length > 0 && (
        <Text accessibilityLiveRegion="polite" style={styles.subtitle}>Updating sources. Your collection is available.</Text>
      )}
      {hero ? <DailyPlateCard {...cardProps(hero)} /> : null}
      <CategoryChips selectedCategory={selectedCategory} onSelectCategory={category => dispatch(setSelectedCategory(category))} />
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {searchQuery.trim() ? 'Search results' : selectedCategory === 'nasa-apod' || (rows.length > 0 && rows.every(item => item.source === 'nasa-apod')) ? 'Daily Plates' : 'Space Dispatches'}
      </Text>
    </View>
  );

  const empty = busy ? (
    <View style={styles.loading}>
      <ActivityIndicator accessibilityLabel="Loading discoveries" color={colors.forest} />
    </View>
  ) : searchQuery.trim() ? (
    <EmptyState icon="search" title="No matches" description="Try a different title, topic, or publisher."
      actionTitle="Clear search" onAction={() => dispatch(setSearchQuery(''))} />
  ) : offline && cacheStatus === 'error' ? (
    <EmptyState icon="alert-circle" title="Could not open the archive" description="Try reading the local collection again."
      actionTitle="Try again" onAction={refresh} />
  ) : offline && !items.length ? (
    <EmptyState icon="cloud-off" title="Nothing downloaded yet" description="Connect to download your first collection." />
  ) : failedSources || refreshError || cacheStatus === 'error' ? null : (
    <EmptyState icon="compass" title="No discoveries in this section" description="Try a different source or pull to refresh." />
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {offline && <OfflineBanner lastSyncedAt={updatedAt} />}
      <FlatList
        data={rows}
        keyExtractor={item => item.localId}
        renderItem={({ item }) => <DispatchRow {...cardProps(item)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ?? undefined}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={connection === 'online' ? <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.forest} /> : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  content: { paddingHorizontal: layout.horizontalInset, paddingBottom: spacing[8] },
  header: { paddingTop: spacing[5], gap: spacing[3] },
  title: { ...typography.display, color: colors.forest },
  subtitle: { ...typography.body, color: colors.muted },
  sectionTitle: { ...typography.h2, color: colors.ink, marginBottom: spacing[2] },
  notice: { gap: spacing[2], backgroundColor: colors.sageLight, padding: spacing[3] },
  noticeText: { ...typography.body, color: colors.ink },
  loading: { padding: spacing[8] },
});
