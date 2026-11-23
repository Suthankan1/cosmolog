import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '../src/components/common/EmptyState';
import { Header } from '../src/components/common/Header';
import { OfflineBanner } from '../src/components/common/OfflineBanner';
import { DispatchRow } from '../src/components/discovery/DispatchRow';
import { getReadingHistory } from '../src/database/repositories/readingRepository';
import { useToggleFavourite } from '../src/features/journal/useToggleFavourite';
import { navigateToDetails } from '../src/navigation/types';
import { useAppSelector } from '../src/store';
import { colors, layout, spacing } from '../src/theme/tokens';
import { formatEditorialDate } from '../src/utils/text';

type History = Awaited<ReturnType<typeof getReadingHistory>>;

export default function ReadingHistoryScreen() {
  const router = useRouter();
  const toggleFavourite = useToggleFavourite();
  const accountId = useAppSelector(state => state.auth.user?.id);
  const { favourites, pending } = useAppSelector(state => state.favourites);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const [result, setResult] = useState<{ accountId: number; attempt: number; rows: History | null }>();
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    if (!accountId) return;
    let active = true;
    void getReadingHistory(accountId).then(
      rows => { if (active) setResult({ accountId, attempt: retry, rows }); },
      () => { if (active) setResult({ accountId, attempt: retry, rows: null }); },
    );
    return () => { active = false; };
  }, [accountId, retry]));

  const rows = result?.accountId === accountId && result?.attempt === retry ? result.rows : undefined;
  const offline = connection === 'offline';
  const syncedAt = Object.values(metadata).flatMap(source => source.lastSyncedAt ?? []).sort().at(-1) ?? legacySyncedAt;
  return (
    <View style={styles.screen}>
      <Header title="Reading history" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}
      <FlatList data={rows ?? []} keyExtractor={item => item.localId} contentContainerStyle={styles.content}
        ListEmptyComponent={rows === undefined
          ? <ActivityIndicator color={colors.forest} accessibilityLabel="Loading reading history" />
          : rows === null
            ? <EmptyState icon="alert-circle" title="Could not load reading history" description="Try reading the archive again."
              actionTitle="Try again" onAction={() => setRetry(value => value + 1)} />
            : <EmptyState icon="book-open" title="No finished discoveries" description="Choose Mark as read at the end of a discovery to add it here." />}
        renderItem={({ item }) => {
          const saved = favourites.find(entry => entry.localId === item.localId);
          return <DispatchRow item={saved ?? item} isSaved={Boolean(saved)} pending={Boolean(pending[item.localId])}
            offline={offline} availability={'Read ' + formatEditorialDate(item.readAt)}
            onPress={() => navigateToDetails(router, item.source, item.externalId)} onToggleSave={() => toggleFavourite(item.localId)} />;
        }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  content: { paddingHorizontal: layout.horizontalInset, paddingVertical: spacing[4] },
});
