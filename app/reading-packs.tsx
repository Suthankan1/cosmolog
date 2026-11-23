import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '../src/components/common/Button';
import { EmptyState } from '../src/components/common/EmptyState';
import { Header } from '../src/components/common/Header';
import { OfflineBanner } from '../src/components/common/OfflineBanner';
import { DispatchRow } from '../src/components/discovery/DispatchRow';
import { getReadingPackItems, removeReadingPack } from '../src/database/repositories/readingPacksRepository';
import { mediaLabel } from '../src/features/discovery/mediaLabel';
import { downloadReadingPack, readingPacks } from '../src/features/discovery/readingPacks';
import { useToggleFavourite } from '../src/features/journal/useToggleFavourite';
import { navigateToDetails } from '../src/navigation/types';
import { useAppDispatch, useAppSelector } from '../src/store';
import { refreshImagesThunk } from '../src/store/slices/favouritesSlice';
import { colors, layout, radii, spacing, typography } from '../src/theme/tokens';
import { formatEditorialDate } from '../src/utils/text';

type Installed = Awaited<ReturnType<typeof getReadingPackItems>>;
type Pack = typeof readingPacks[number];

export default function ReadingPacksScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toggleFavourite = useToggleFavourite();
  const accountId = useAppSelector(state => state.auth.user?.id);
  const { favourites, pending, mediaRevision, isDownloading } = useAppSelector(state => state.favourites);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const [result, setResult] = useState<{ owner: number; items: Installed | null }>();
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState<{ packId: string; text: string }>();
  const work = useRef<AbortController | null>(null);
  const readRequest = useRef(0);

  const reload = useCallback(async (owner: number, isActive: () => boolean = () => true) => {
    const request = ++readRequest.current;
    const items = await getReadingPackItems(owner).catch(() => null);
    if (isActive() && readRequest.current === request) setResult({ owner, items });
  }, []);
  useFocusEffect(useCallback(() => {
    if (!accountId) return;
    let active = true;
    void reload(accountId, () => active);
    return () => { active = false; };
  }, [accountId, reload]));
  useEffect(() => {
    if (mediaRevision > 0 && accountId) void reload(accountId);
  }, [accountId, mediaRevision, reload]);
  useEffect(() => () => work.current?.abort(), [accountId]);
  useEffect(() => {
    if (connection === 'offline') work.current?.abort();
  }, [connection]);

  const installed = result?.owner === accountId ? result?.items : undefined;
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const start = async (pack: Pack) => {
    if (!accountId || work.current || busy || connection !== 'online') return;
    const controller = new AbortController();
    work.current = controller;
    setBusy(pack.id);
    setNotice(undefined);
    try {
      const missing = await downloadReadingPack(accountId, pack, controller.signal,
        () => reload(accountId, () => !controller.signal.aborted));
      if (controller.signal.aborted) {
        setNotice({ packId: pack.id, text: 'Download paused. Reconnect and resume to finish.' });
      } else if (missing.length) {
        setNotice({ packId: pack.id, text: 'Some plates could not be downloaded. Resume to retry the missing entries.' });
      }
      await dispatch(refreshImagesThunk());
    } catch {
      setNotice({ packId: pack.id, text: 'Could not prepare the pack. Try again.' });
    } finally {
      work.current = null;
      await reload(accountId);
      setBusy(undefined);
    }
  };

  const remove = async (pack: Pack) => {
    if (!accountId || busy || work.current) return;
    setBusy(pack.id);
    setNotice(undefined);
    try {
      await removeReadingPack(accountId, pack.id);
      await reload(accountId);
      void dispatch(refreshImagesThunk());
    } catch {
      setNotice({ packId: pack.id, text: 'Could not remove this pack. Try again.' });
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Reading packs" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}
      {installed === undefined ? (
        <ActivityIndicator style={styles.loading} color={colors.forest} accessibilityLabel="Loading reading packs" />
      ) : installed === null ? (
        <EmptyState icon="alert-circle" title="Could not open reading packs" description="Try reading the local archive again."
          actionTitle="Try again" onAction={() => { if (accountId) void reload(accountId); }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {readingPacks.map(pack => {
            const packItems = installed.filter(item => item.packId === pack.id);
            const eligible = packItems.filter(item => item.mediaStatus !== 'text-only');
            const imageCount = eligible.filter(item => item.mediaStatus === 'ready').length;
            const textReady = packItems.length === pack.entries.length;
            const hasWork = !textReady || imageCount < eligible.length;
            return (
              <View key={pack.id} style={styles.pack}>
                <Text accessibilityRole="header" style={styles.title}>{pack.title}</Text>
                <Text style={styles.copy}>{pack.description}</Text>
                <Text accessibilityLiveRegion="polite" style={styles.status}>
                  {packItems.length} of {pack.entries.length} plates saved for offline reading
                  {eligible.length ? '\n' + imageCount + ' of ' + eligible.length + ' eligible images ready' : ''}
                </Text>
                {pack.entries.map(entry => {
                  const item = packItems.find(plate => plate.externalId === entry.date);
                  if (!item) return (
                    <View key={entry.date} style={styles.missing}>
                      <Text style={styles.entryTitle}>{entry.title}</Text>
                      <Text style={styles.metadata}>{formatEditorialDate(entry.date)} · Not downloaded</Text>
                    </View>
                  );
                  return <DispatchRow key={entry.date} item={item} offline={offline} availability={mediaLabel(item.mediaStatus, offline)}
                    isSaved={favourites.some(saved => saved.localId === item.localId)} pending={Boolean(pending[item.localId])}
                    onPress={() => navigateToDetails(router, item.source, item.externalId)} onToggleSave={() => toggleFavourite(item.localId)} />;
                })}
                {hasWork && (
                  <Button title={textReady ? 'Retry pack images' : packItems.length ? 'Resume download' : 'Download pack'} icon="download"
                    disabled={connection !== 'online' || Boolean(busy && busy !== pack.id)} loading={busy === pack.id || (textReady && isDownloading)}
                    accessibilityLabel={(textReady ? 'Retry images for ' : packItems.length ? 'Resume download for ' : 'Download ') + pack.title}
                    onPress={() => { void start(pack); }} />
                )}
                {hasWork && offline && <Text style={styles.metadata}>Connect to download the rest of this pack.</Text>}
                {packItems.length > 0 && (
                  <Button title="Remove download" icon="trash-2" variant="outline" disabled={Boolean(busy)}
                    accessibilityLabel={'Remove download for ' + pack.title} onPress={() => Alert.alert('Remove this download?',
                      'Any favourites and field notes stay on the Field Shelf.', [
                        { text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => { void remove(pack); } },
                      ])} />
                )}
                {notice?.packId === pack.id && <Text accessibilityRole="alert" style={styles.error}>{notice.text}</Text>}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  content: { gap: spacing[4], paddingHorizontal: layout.horizontalInset, paddingVertical: spacing[4] },
  pack: { gap: spacing[2], padding: spacing[3], backgroundColor: colors.surface, borderRadius: radii.md },
  title: { ...typography.h1, color: colors.forest },
  entryTitle: { ...typography.h2, color: colors.ink },
  missing: { paddingVertical: spacing[3], borderBottomWidth: 1, borderColor: colors.border, gap: spacing[1] },
  copy: { ...typography.body, color: colors.ink },
  status: { ...typography.label, color: colors.forest },
  metadata: { ...typography.bodySmall, color: colors.muted },
  error: { ...typography.bodySmall, color: colors.danger },
  loading: { marginTop: spacing[5] },
});
