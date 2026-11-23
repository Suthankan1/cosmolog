import { Image } from 'expo-image';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { DestinationGroup } from '../../src/components/common/DestinationGroup';
import { useTabContentInset } from '../../src/navigation/useTabContentInset';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { loadOlder, setSearchQuery, setSelectedCategory } from '../../src/store/slices/feedSlice';
import { useToggleFavourite } from '../../src/features/journal/useToggleFavourite';
import { refreshArchive } from '../../src/store/archiveLifecycle';
import { selectFeed } from '../../src/features/discovery/selectFeed';
import { BrowseByDate } from '../../src/features/discovery/BrowseByDate';
import { OnThisDay } from '../../src/features/discovery/OnThisDay';
import { useLibrarySearch } from '../../src/features/discovery/useLibrarySearch';
import { clearReadingCheckpoint, getReadingCheckpoint } from '../../src/database/repositories/readingRepository';
import { navigateToDetails } from '../../src/navigation/types';
import { colors, layout, spacing, typography } from '../../src/theme/tokens';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { FeaturedStory } from '../../src/components/discovery/FeaturedStory';
import { DispatchRow } from '../../src/components/discovery/DispatchRow';
import { CategoryChips } from '../../src/components/discovery/CategoryChips';
import { SearchBar } from '../../src/components/discovery/SearchBar';
import { EmptyState } from '../../src/components/common/EmptyState';
import { Button } from '../../src/components/common/Button';

export default function DiscoverScreen() {
  const paddingBottom = useTabContentInset();
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const toggleFavourite = useToggleFavourite();
  const { moreCached, cursor, appending, appendError, items, selectedCategory, searchQuery, cacheStatus, connection, metadata, legacySyncedAt, isRefreshing, refreshError } =
    useAppSelector(state => state.feed);
  const { favourites, pending, error: saveError } = useAppSelector(state => state.favourites);
  const savedItems = useMemo(() => new Map(favourites.map(item => [item.localId, item])), [favourites]);
  const accountId = useAppSelector(state => state.auth.user?.id);
  const searching = Boolean(searchQuery.trim());
  const library = useLibrarySearch(accountId, selectedCategory, searchQuery, connection === 'online');
  const { hero, rows: feedRows } = useMemo(() => selectFeed(items, selectedCategory), [items, selectedCategory]);
  const rows = searching ? library.rows : feedRows;
  const [checkpoint, setCheckpoint] = useState<{ accountId: number; data: Awaited<ReturnType<typeof getReadingCheckpoint>> }>();
  const [checkpointError, setCheckpointError] = useState(false);
  useFocusEffect(useCallback(() => {
    if (!accountId) return;
    let active = true;
    void getReadingCheckpoint(accountId).then(
      data => { if (active) setCheckpoint({ accountId, data }); },
      () => { if (active) setCheckpointError(true); },
    );
    return () => { active = false; };
  }, [accountId]));
  const resume = checkpoint && checkpoint.accountId === accountId ? checkpoint.data : null;
  const dismissResume = async () => {
    if (!accountId || !resume) return;
    try {
      await clearReadingCheckpoint(accountId, resume.item.localId);
      setCheckpoint({ accountId, data: null });
      setCheckpointError(false);
    } catch {
      setCheckpointError(true);
    }
  };
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

  const empty = busy ? (
    <View style={styles.loading}>
      <ActivityIndicator accessibilityLabel="Loading discoveries" color={colors.forest} />
    </View>
  ) : cacheStatus === 'error' ? (
    <EmptyState icon="alert-circle" title="Could not open the archive" description="Try reading the local collection again."
      actionTitle="Try again" onAction={refresh} />
  ) : searching && library.errors.length > 0 ? (
    <EmptyState icon="alert-circle" title="Some search results are unavailable" description="Retry the unavailable sources below."
      actionTitle="Try again" onAction={library.retry} />
  ) : searching && library.pending ? (
    <ActivityIndicator accessibilityLabel="Searching space materials" color={colors.forest} style={styles.loading} />
  ) : searching ? (
    <EmptyState icon="search" title="No matches" description="Try a different title, topic, or publisher."
      actionTitle="Clear search" onAction={() => dispatch(setSearchQuery(''))} />
  ) : offline && !items.length ? (
    <EmptyState icon="cloud-off" title="Nothing downloaded yet" description="Connect to download your first collection." />
  ) : failedSources || refreshError ? null : (
    <EmptyState icon="compass" title="No discoveries in this section" description="Try a different source or pull to refresh." />
  );

  const canLoadOlder = !searching && selectedCategory !== 'nasa-apod' && (moreCached || (connection === 'online' && cursor?.next_offset != null));
  const header = (
    <View style={styles.header}>
      <Image source={require('../../assets/brand/cosmolog-lockup.svg')} contentFit="contain"
        accessible accessibilityLabel="COSMOLOG magazine" style={styles.masthead} />
      <SearchBar placeholder="Search space materials" accessibilityLabel="Search space materials" value={searchQuery} onChangeText={value => dispatch(setSearchQuery(value))} onClear={() => dispatch(setSearchQuery(''))} />
      <CategoryChips selectedCategory={selectedCategory} onSelectCategory={category => dispatch(setSelectedCategory(category))} />
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
      {!searching && hero && <Animated.View key={hero.localId} entering={reducedMotion ? undefined : FadeIn.duration(160)}>
        <FeaturedStory {...cardProps(hero)} />
      </Animated.View>}
      {!searching && !hero && empty}
      {!searching && resume && (
        <View style={styles.notice}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Continue Reading</Text>
          <Text style={styles.noticeText}>{resume.item.title}</Text>
          <Button title="Resume reading" icon="book-open"
            onPress={() => navigateToDetails(router, resume.item.source, resume.item.externalId)} />
          <Button title="Dismiss" variant="outline" onPress={() => { void dismissResume(); }} />
        </View>
      )}
      {checkpointError && <Text accessibilityRole="alert" style={styles.noticeText}>Could not update your reading position.</Text>}
      {!searching && <DestinationGroup title="Study, sky and archives" icon="layers">
        <Button title="Space Study" icon="book-open" variant="destination" onPress={() => router.push('/study')} />
        <Button title="Sky Viewer" icon="compass" variant="destination" onPress={() => router.push('/sky-viewer')} />
        <Button title="Offline reading packs" icon="download" variant="destination" onPress={() => router.push('/reading-packs')} />
        {selectedCategory !== 'spaceflight-news' && <>
          <BrowseByDate />
          <OnThisDay connection={connection} />
        </>}
      </DestinationGroup>}
      {searching && library.rows.length > 0 && <Text style={styles.subtitle} accessibilityLiveRegion="polite">
        {library.localCount} from this device · {library.rows.length - library.localCount} from online archives
      </Text>}
      {(searching || rows.length > 0) && <Text accessibilityRole="header" style={styles.sectionTitle}>
        {searching ? 'Search results' : selectedCategory === 'all' ? 'Latest stories' : selectedCategory === 'nasa-apod' ? 'More Daily Plates' : 'More Dispatches'}
      </Text>}
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {offline && <OfflineBanner lastSyncedAt={updatedAt} />}
      <FlatList
        data={rows}
        keyExtractor={item => item.localId}
        renderItem={({ item }) => <DispatchRow {...cardProps(item)} />}
        onEndReachedThreshold={0.35}
        onEndReached={() => { if (searching && library.more && !library.pending) library.moreResults();
          else if (canLoadOlder && !appendError) void dispatch(loadOlder()); }}
        ListFooterComponent={searching ? <View style={styles.header}>
          {library.pending && rows.length > 0 && <ActivityIndicator accessibilityLabel="Searching archives" />}
          {library.errors.length > 0 && <Button title={'Retry ' + library.errors.join(', ')} onPress={library.retry} variant="outline" />}
          {library.more && <Button title="Load more results" loading={library.pending} onPress={library.moreResults} variant="outline" />}
        </View> : canLoadOlder ? <Button title={appendError ? 'Retry loading older stories' : 'Load more stories'}
          loading={appending} onPress={() => void dispatch(loadOlder())} variant="outline" /> : undefined}
        ListHeaderComponent={header}
        ListEmptyComponent={searching ? empty ?? undefined : undefined}
        contentContainerStyle={[styles.content, { paddingBottom }]}
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
  masthead: { width: '100%', aspectRatio: 717 / 102, marginBottom: spacing[1] },
  subtitle: { ...typography.body, color: colors.muted },
  sectionTitle: { ...typography.h2, color: colors.ink, marginBottom: spacing[2] },
  notice: { gap: spacing[2], backgroundColor: colors.sageLight, padding: spacing[3] },
  noticeText: { ...typography.body, color: colors.ink },
  loading: { padding: spacing[8] },
});
