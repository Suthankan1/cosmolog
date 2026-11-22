import React, { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../../src/store';
import { refreshImagesThunk, toggleFavouriteThunk } from '../../../src/store/slices/favouritesSlice';
import { parseDetailsParams } from '../../../src/navigation/types';
import { colors, layout, radii, spacing, typography } from '../../../src/theme/tokens';
import { formatEditorialDate } from '../../../src/utils/text';
import { Header } from '../../../src/components/common/Header';
import { Button } from '../../../src/components/common/Button';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { OfflineBanner } from '../../../src/components/common/OfflineBanner';
import { DiscoveryImage } from '../../../src/components/discovery/DiscoveryImage';
import { useDiscoveryRecord } from '../../../src/features/discovery/useDiscoveryRecord';
import { mediaLabel } from '../../../src/features/discovery/mediaLabel';
import { httpsUrl } from '../../../src/services/api/mediaPolicy';

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ source?: string; id?: string }>();
  const parsed = parseDetailsParams(params);
  const { result, retry } = useDiscoveryRecord(parsed);
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const { favourites, pending, error, isDownloading } = useAppSelector(state => state.favourites);
  const [linkError, setLinkError] = useState<string | null>(null);
  const offline = connection === 'offline';
  const sourceUpdatedAt = parsed ? metadata[parsed.source].lastSyncedAt : null;

  const header = (
    <>
      <Header title={parsed?.source === 'nasa-apod' ? 'Daily Plate' : 'Space Dispatch'} showBack />
      {offline && <OfflineBanner lastSyncedAt={sourceUpdatedAt ?? legacySyncedAt} />}
    </>
  );

  if (!parsed || result.status !== 'ready') {
    const isLoading = Boolean(parsed && result.status === 'loading');
    const canRetry = Boolean(parsed && (result.status === 'error' || result.status === 'offline'));
    const message = result.status === 'offline'
      ? 'This discovery is not on this device yet. Reconnect to open it.'
      : result.status === 'error'
        ? 'The source or local archive could not be read. Try again.'
        : 'This discovery link is invalid or the source could not find it.';
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
  const canonicalUrl = httpsUrl(item.canonicalUrl);
  const sourceName = item.source === 'nasa-apod' ? 'NASA Astronomy Picture of the Day' : item.attribution || 'Spaceflight News';
  const openSource = async () => {
    if (!canonicalUrl) return;
    setLinkError(null);
    try {
      await Linking.openURL(canonicalUrl);
    } catch {
      setLinkError('Could not open the source link. Try again.');
    }
  };

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing[8] + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <DiscoveryImage item={saved ?? item} offline={offline} style={styles.image} labelled />
        <View style={styles.article}>
          <Text style={styles.metadata}>{formatEditorialDate(item.publishedAt)}</Text>
          <Text accessibilityRole="header" style={styles.title}>{item.title}</Text>
          {item.author && <Text style={styles.byline}>{item.author}</Text>}
          <Button
            title={saved ? 'Remove from Favourites' : 'Save to Favourites'}
            icon="bookmark"
            variant={saved ? 'outline' : 'primary'}
            loading={Boolean(pending[item.localId])}
            onPress={() => { void dispatch(toggleFavouriteThunk(item.localId)); }}
          />
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {saved && <Text accessibilityLiveRegion="polite" style={styles.metadata}>{mediaLabel(saved.mediaStatus, offline)}</Text>}
          {saved?.mediaStatus === 'failed' && connection === 'online' && (
            <Button title="Retry image download" variant="outline" icon="refresh-cw" loading={isDownloading}
              onPress={() => { void dispatch(refreshImagesThunk()); }} />
          )}
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {item.source === 'nasa-apod' ? 'About this observation' : 'Publisher summary'}
          </Text>
          {(item.body || 'The source did not provide a summary.').split(/\n\n+/).map((paragraph, index) =>
            <Text key={index} style={styles.body}>{paragraph}</Text>
          )}
          <View style={styles.source}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Original source</Text>
            <Text style={styles.body}>{sourceName}</Text>
            {item.source === 'nasa-apod' && item.attribution && <Text style={styles.metadata}>Credit: {item.attribution}</Text>}
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
              <Button title={item.mediaType === 'video' ? 'Watch at the source' : 'Open original publication'}
                variant="outline" icon="external-link" onPress={openSource} disabled={offline} />
            )}
            {offline && canonicalUrl && <Text style={styles.metadata}>Connect to open the original publication.</Text>}
            {linkError && <Text accessibilityRole="alert" style={styles.error}>{linkError}</Text>}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.ivory, flex: 1 },
  content: { paddingTop: 0 },
  image: { width: '100%', aspectRatio: 1.55 },
  article: {
    paddingHorizontal: layout.horizontalInset, paddingTop: spacing[5], gap: spacing[3],
    backgroundColor: colors.ivory, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl,
    marginTop: -spacing[3],
  },
  title: { ...typography.display, color: colors.forest },
  byline: { ...typography.body, color: colors.muted },
  metadata: { ...typography.bodySmall, color: colors.muted },
  sectionTitle: { ...typography.h2, color: colors.forest },
  body: { ...typography.body, fontSize: 16, lineHeight: 25, color: colors.ink },
  error: { ...typography.bodySmall, color: colors.danger },
  source: { gap: spacing[2], padding: spacing[4], borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  loading: { marginTop: spacing[8] },
});
