import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../../src/store';
import { loadFavouritesThunk, refreshImagesThunk, saveFieldNoteThunk } from '../../../src/store/slices/favouritesSlice';
import { parseDetailsParams } from '../../../src/navigation/types';
import { colors, layout, radii, spacing, typography } from '../../../src/theme/tokens';
import { formatEditorialDate } from '../../../src/utils/text';
import { Header } from '../../../src/components/common/Header';
import { Button } from '../../../src/components/common/Button';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { OfflineBanner } from '../../../src/components/common/OfflineBanner';
import { DiscoveryImage } from '../../../src/components/discovery/DiscoveryImage';
import { useReadingPosition } from '../../../src/features/discovery/useReadingPosition';
import { useDiscoveryRecord } from '../../../src/features/discovery/useDiscoveryRecord';
import { useToggleFavourite } from '../../../src/features/journal/useToggleFavourite';
import { FieldNote } from '../../../src/features/journal/FieldNote';
import { mediaLabel } from '../../../src/features/discovery/mediaLabel';
import { publicationName, shareDiscoveryContent } from '../../../src/features/discovery/shareDiscovery';
import { useOfflineMedia } from '../../../src/features/discovery/useOfflineMedia';
import { httpsUrl } from '../../../src/services/api/mediaPolicy';

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ source?: string; id?: string }>();
  const parsed = parseDetailsParams(params);
  const { result, retry } = useDiscoveryRecord(parsed);
  const accountId = useAppSelector(state => state.auth.user?.id);
  const { scroll, paragraphs, beginScroll, trackScroll, markRead, isRead, status: readingStatus, completeScroll,
    measureViewport, measureContent, measureArticle, measureBody, measureParagraph } =
    useReadingPosition(accountId, result.status === 'ready' ? result.item : undefined);
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const toggleFavourite = useToggleFavourite();
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const { favourites, pending, error, isDownloading } = useAppSelector(state => state.favourites);
  const localMedia = useOfflineMedia(accountId, result.status === 'ready' ? result.item.localId : undefined);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const offline = connection === 'offline';
  const sourceUpdatedAt = parsed?.source === 'nasa-media' ? (result.status === 'ready' ? result.item.fetchedAt : null) : parsed ? metadata[parsed.source].lastSyncedAt ?? legacySyncedAt : null;

  const header = (
    <>
      <Header title={parsed?.source === 'nasa-apod' ? 'Daily Plate' : parsed?.source === 'nasa-media' ? 'NASA Media' : 'Space Dispatch'} showBack />
      {offline && <OfflineBanner lastSyncedAt={sourceUpdatedAt} />}
    </>
  );

  if (!parsed || result.status !== 'ready') {
    const isLoading = Boolean(parsed && result.status === 'loading');
    const canRetry = Boolean(parsed && (result.status === 'error' || result.status === 'offline'));
    const message = !parsed ? 'This discovery link has an invalid source or identifier.' : result.status === 'offline'
      ? 'This discovery is not on this device yet. Reconnect to open it.'
      : result.status === 'error'
        ? 'The source or local archive could not be read. Try again.'
        : 'The source could not find this discovery.';
    return (
      <View style={styles.screen}>
        {header}
        {isLoading ? (
          <ActivityIndicator accessibilityLabel="Loading discovery" color={colors.forest} style={styles.loading} />
        ) : (
          <EmptyState icon="alert-circle" title={result.status === 'offline' ? 'Not downloaded' : 'Could not open discovery'}
            description={message} actionTitle={canRetry ? 'Try again' : undefined} onAction={canRetry ? retry : undefined} />
        )}
      </View>
    );
  }

  const { item } = result;
  const saved = favourites.find(entry => entry.localId === item.localId);
  const availableMedia = saved ?? localMedia;
  const displayItem = availableMedia ? { ...item, imageLocalUri: availableMedia.imageLocalUri } : item;
  const canonicalUrl = httpsUrl(item.canonicalUrl);
  const sourceName = publicationName(item);
  const openSource = async () => {
    if (!canonicalUrl) return;
    setLinkError(null);
    try {
      await Linking.openURL(canonicalUrl);
    } catch {
      setLinkError('Could not open the source link. Try again.');
    }
  };
  const share = async () => {
    const content = shareDiscoveryContent(item);
    if (!content || sharing) return;
    setLinkError(null);
    setSharing(true);
    try {
      await Share.share(content, { subject: content.title, dialogTitle: 'Share discovery' });
    } catch {
      setLinkError('Could not open sharing. Try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView
        ref={scroll}
        onLayout={measureViewport}
        onContentSizeChange={measureContent}
        onScrollBeginDrag={beginScroll}
        onScroll={trackScroll}
        onScrollEndDrag={completeScroll}
        onMomentumScrollEnd={completeScroll}
        scrollEventThrottle={32}
        contentContainerStyle={[styles.content, { paddingBottom: spacing[8] + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.article} onLayout={measureArticle}>
          <Text style={styles.kicker}>{sourceName} · {item.source === 'nasa-media' && item.publishedAt ? 'Created ' : ''}{formatEditorialDate(item.publishedAt)}</Text>
          <Text accessibilityRole="header" style={styles.title}>{item.title}</Text>
          {item.author && <Text style={styles.byline}>{item.author}</Text>}
          <Button
            title={saved ? 'Remove from Favourites' : 'Save to Favourites'}
            icon={saved ? 'check' : 'bookmark'}
            variant={saved ? 'outline' : 'primary'}
            loading={Boolean(pending[item.localId])}
            onPress={() => toggleFavourite(item.localId)}
          />
          <DiscoveryImage item={displayItem} offline={offline} style={styles.image} labelled cover />
          {item.source !== 'spaceflight-news' && item.attribution && <Text style={styles.metadata}>Credit: {item.attribution}</Text>}
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {availableMedia && <Text accessibilityLiveRegion="polite" style={styles.metadata}>{mediaLabel(availableMedia.mediaStatus, offline)}</Text>}
          {(availableMedia?.mediaStatus === 'failed' || availableMedia?.mediaStatus === 'previous') && connection === 'online' && (
            <Button title="Retry image download" variant="outline" icon="refresh-cw" loading={isDownloading}
              onPress={() => { void dispatch(refreshImagesThunk()); }} />
          )}
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {item.source === 'nasa-apod' ? 'About this observation' : item.source === 'nasa-media' ? 'Archive description' : 'Publisher summary'}
          </Text>
          <View onLayout={measureBody} style={styles.paragraphs}>
            {paragraphs.length ? paragraphs.map((paragraph, index) =>
              <Text key={index} onLayout={event => measureParagraph(index, event)} style={styles.body}>{paragraph}</Text>
            ) : <Text style={styles.body}>The source did not provide a summary.</Text>}
          </View>
          {isRead ? <Text accessibilityLiveRegion="polite" style={styles.metadata}>Marked as read</Text>
            : paragraphs.length > 0 && <Button title="Mark as read" icon="check" variant="outline"
              onPress={async () => {
                if (accountId && await markRead()) void dispatch(loadFavouritesThunk(accountId));
              }} />}
          {!isRead && readingStatus && <Text accessibilityRole="alert" style={styles.error}>{readingStatus}</Text>}
          {saved && <FieldNote key={item.localId} note={saved.note} onSave={text => dispatch(saveFieldNoteThunk(item.localId, text))} />}
          <View style={styles.source}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Original source</Text>
            <Text style={styles.body}>{sourceName}</Text>
            {item.source !== 'spaceflight-news' && item.attribution && <Text style={styles.metadata}>Credit: {item.attribution}</Text>}
            {httpsUrl(item.imageLicenseUrl) && (
              <Button title="Image license" variant="outline" icon="external-link" disabled={offline}
                onPress={async () => {
                  const url = httpsUrl(item.imageLicenseUrl);
                  if (!url) return;
                  try {
                    await Linking.openURL(url);
                  } catch {
                    setLinkError('Could not open the image license.');
                  }
                }} />
            )}
            {canonicalUrl && (
              <Button title={item.mediaType === 'video' ? 'Watch at the source' : item.mediaType === 'audio' ? 'Listen at the source' : 'Open original publication'}
                variant="outline" icon="external-link" onPress={openSource} disabled={offline} />
            )}
            {offline && canonicalUrl && <Text style={styles.metadata}>{canonicalUrl}{'\n'}Connect to open the original source.</Text>}
            {canonicalUrl && Platform.OS !== 'web' && <Button title="Share discovery" icon="share-2" variant="outline"
              loading={sharing} onPress={() => { void share(); }} />}
            {linkError && <Text accessibilityRole="alert" style={styles.error}>{linkError}</Text>}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.ivory, flex: 1 },
  content: { paddingTop: 0 },
  image: { width: '100%', aspectRatio: 1.55 },
  article: {
    paddingHorizontal: layout.horizontalInset, paddingTop: spacing[5], gap: spacing[3],
    backgroundColor: colors.ivory,
  },
  title: { ...typography.display, color: colors.forest },
  kicker: { ...typography.label, color: colors.forest, borderTopWidth: 2, borderColor: colors.terracotta, paddingTop: spacing[3] },
  byline: { ...typography.body, color: colors.muted },
  metadata: { ...typography.bodySmall, color: colors.muted },
  paragraphs: { gap: spacing[3] },
  sectionTitle: { ...typography.h2, color: colors.forest },
  body: { ...typography.body, fontSize: 16, lineHeight: 25, color: colors.ink },
  error: { ...typography.bodySmall, color: colors.danger },
  source: { backgroundColor: colors.surface, gap: spacing[2], padding: spacing[4], borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  loading: { marginTop: spacing[8] },
});
