import { useTabContentInset } from '../../src/navigation/useTabContentInset';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { importFavouritesThunk, loadFavouritesThunk, refreshImagesThunk } from '../../src/store/slices/favouritesSlice';
import { navigateToDetails } from '../../src/navigation/types';
import { colors, layout, spacing, typography } from '../../src/theme/tokens';
import { DispatchRow } from '../../src/components/discovery/DispatchRow';
import { SearchBar } from '../../src/components/discovery/SearchBar';
import { Button } from '../../src/components/common/Button';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { DestinationGroup } from '../../src/components/common/DestinationGroup';
import { FilterChip } from '../../src/components/common/FilterChip';
import { useToggleFavourite } from '../../src/features/journal/useToggleFavourite';
import { selectShelf, type ShelfSort } from '../../src/features/journal/selectShelf';
import { mediaLabel } from '../../src/features/discovery/mediaLabel';

export default function FavouritesScreen() {
  const paddingBottom = useTabContentInset();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const toggleFavourite = useToggleFavourite();
  const { favourites, accountId, pending, legacyCount, isLoading, error } = useAppSelector(state => state.favourites);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const [query, setQuery] = useState('');
  const [withNotes, setWithNotes] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [unread, setUnread] = useState(false);
  const [sort, setSort] = useState<ShelfSort>('saved');
  const [importing, setImporting] = useState(false);
  const offline = connection === 'offline';
  const syncTime = [metadata['nasa-apod'].lastSyncedAt, metadata['spaceflight-news'].lastSyncedAt]
    .filter((value): value is string => Boolean(value)).sort().at(-1) ?? legacySyncedAt;

  const results = useMemo(() => selectShelf(favourites, { query, withNotes, downloaded, unread, sort }),
    [favourites, query, withNotes, downloaded, unread, sort]);
  const reload = () => { if (accountId) void dispatch(loadFavouritesThunk(accountId)); };
  const clearFilters = () => { setQuery(''); setWithNotes(false); setDownloaded(false); setUnread(false); };

  const importBookmarks = async () => {
    if (!accountId || importing) return;
    setImporting(true);
    const action = await dispatch(importFavouritesThunk(accountId));
    if (importFavouritesThunk.fulfilled.match(action)) {
      await dispatch(loadFavouritesThunk(accountId));
      void dispatch(refreshImagesThunk());
    }
    setImporting(false);
  };

  const header = (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>Field Shelf</Text>
      <Text style={styles.subtitle}>Saved discoveries and private field notes.</Text>
      <DestinationGroup title="Shelf tools" icon="folder">
        <Button title="Saved study entries" icon="book-open" variant="destination" onPress={() => router.push({ pathname: '/study', params: { saved: '1' } })} />
        <Button title="Collections" icon="folder" variant="destination" onPress={() => router.push('/collections')} />
        <Button title="Reading history" icon="clock" variant="destination" onPress={() => router.push('/reading-history')} />
      </DestinationGroup>
      {legacyCount > 0 && <Button title="Import earlier bookmarks" variant="outline" loading={importing}
        onPress={() => Alert.alert('Import earlier bookmarks?', 'Add bookmarks from an earlier app version to this account.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Import', onPress: () => { void importBookmarks(); } },
        ])} />}
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      {favourites.length > 0 && (
        <>
          <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery('')}
            placeholder="Search saved discoveries and notes" accessibilityLabel="Search the Field Shelf" />
          <View style={styles.filters}>
            <FilterChip title="With notes" selected={withNotes} onPress={() => setWithNotes(value => !value)} />
            <FilterChip title="To read" selected={unread} onPress={() => setUnread(value => !value)} />
            <FilterChip title="Image downloaded" selected={downloaded} onPress={() => setDownloaded(value => !value)} />
            <FilterChip title={sort === 'saved' ? 'Recently saved' : 'Publication date'} selected={sort === 'published'}
              onPress={() => setSort(value => value === 'saved' ? 'published' : 'saved')} />
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.count}>{results.length} of {favourites.length} saved</Text>
        </>
      )}
    </View>
  );

  const empty = isLoading ? <ActivityIndicator accessibilityLabel="Loading saved discoveries" color={colors.forest} /> :
    error && !favourites.length ? (
      <EmptyState icon="alert-circle" title="Could not open the Shelf" description={error} actionTitle="Try again" onAction={reload} />
    ) : favourites.length ? (
      <EmptyState icon="search" title="No matching discoveries" description="Change your search or filters to see more."
        actionTitle="Clear filters" onAction={clearFilters} />
    ) : (
      <EmptyState icon="book-open" title="Keep a discovery close" description="Save a plate or dispatch to read it from your Shelf, even offline."
        actionTitle="Explore discoveries" onAction={() => router.navigate('/(tabs)/discover')} />
    );

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
      {offline && <OfflineBanner lastSyncedAt={syncTime} />}
      <FlatList
        data={results}
        keyExtractor={item => item.localId}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={colors.forest} />}
        renderItem={({ item }) => (
          <DispatchRow item={item} isSaved pending={Boolean(pending[item.localId])} offline={offline}
            availability={mediaLabel(item.mediaStatus, offline)} notePreview={item.note}
            onPress={() => navigateToDetails(router, item.source, item.externalId)}
            onToggleSave={() => toggleFavourite(item.localId)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  content: { paddingHorizontal: layout.horizontalInset, paddingBottom: spacing[8] },
  header: { paddingTop: spacing[5], gap: spacing[3], marginBottom: spacing[2] },
  title: { ...typography.display, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  count: { ...typography.bodySmall, color: colors.muted },
  error: { ...typography.bodySmall, color: colors.danger },
});
