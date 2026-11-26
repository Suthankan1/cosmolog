import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '../src/components/common/Button';
import { EmptyState } from '../src/components/common/EmptyState';
import { Header } from '../src/components/common/Header';
import { Icon } from '../src/components/common/Icon';
import { OfflineBanner } from '../src/components/common/OfflineBanner';
import {
  clearEligibleCache,
  getOfflineStorageSummary,
  previewClearCache,
  type ClearCachePreview,
  type OfflineStorageSummary,
  type StorageItemDetail,
} from '../src/features/storage/offlineStorageProjection';
import { useAppDispatch, useAppSelector } from '../src/store';
import { refreshImagesThunk } from '../src/store/slices/favouritesSlice';
import { colors, layout, radii, spacing, typography } from '../src/theme/tokens';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function StatusPill({ status, isShared }: { status: StorageItemDetail['status']; isShared: boolean }) {
  let badgeColor: string = colors.forest;
  let badgeBg: string = colors.sageLight;
  let label = 'READY';

  switch (status) {
    case 'ready':
      badgeColor = colors.forest;
      badgeBg = colors.sageLight;
      label = 'OFFLINE READY';
      break;
    case 'previous':
      badgeColor = colors.brass;
      badgeBg = colors.surface;
      label = 'PREVIOUS VERSION';
      break;
    case 'waiting':
      badgeColor = colors.muted;
      badgeBg = colors.surface;
      label = 'PENDING SYNC';
      break;
    case 'failed':
      badgeColor = colors.danger;
      badgeBg = colors.surface;
      label = 'FILE MISSING';
      break;
    case 'text-only':
      badgeColor = colors.muted;
      badgeBg = colors.surface;
      label = 'TEXT ONLY';
      break;
  }

  return (
    <View style={styles.pillContainer}>
      <View style={[styles.pill, { backgroundColor: badgeBg }]}>
        <Text style={[styles.pillText, { color: badgeColor }]}>{label}</Text>
      </View>
      {isShared && (
        <View style={[styles.pill, { backgroundColor: colors.forest }]}>
          <Text style={[styles.pillText, { color: colors.ivory }]}>SHARED</Text>
        </View>
      )}
    </View>
  );
}

export default function OfflineLibraryScreen() {
  const dispatch = useAppDispatch();
  const accountId = useAppSelector(state => state.auth.user?.id);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const { isDownloading } = useAppSelector(state => state.favourites);

  const [summary, setSummary] = useState<OfflineStorageSummary | null>(null);
  const [preview, setPreview] = useState<ClearCachePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'favourites' | 'expeditions' | 'study' | 'cache' | null>('favourites');

  const reload = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const [data, prev] = await Promise.all([
        getOfflineStorageSummary(accountId),
        previewClearCache(accountId),
      ]);
      setSummary(data);
      setPreview(prev);
    } catch {
      setSummary(null);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const handleCleanCache = () => {
    if (!preview || preview.reclaimableCount === 0) {
      Alert.alert('Cache is clean', 'There are no unowned cache files to remove.');
      return;
    }

    Alert.alert(
      'Clean unowned cache?',
      `This will reclaim ${formatBytes(preview.reclaimableBytes)} across ${preview.reclaimableCount} unowned discoveries.\n\nYour ${preview.protectedFavouritesCount} Field Shelf favourites, notes, and ${preview.protectedPackItemsCount} expedition downloads are protected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean cache',
          style: 'destructive',
          onPress: async () => {
            setIsCleaning(true);
            try {
              const res = await clearEligibleCache();
              await reload();
              void dispatch(refreshImagesThunk());
              Alert.alert('Cache cleaned', `Reclaimed ${formatBytes(res.freedBytes)} of device storage.`);
            } catch {
              Alert.alert('Error', 'Could not clean cache. Try again.');
            } finally {
              setIsCleaning(false);
            }
          },
        },
      ],
    );
  };

  const handleRetryMedia = async () => {
    if (connection === 'offline') {
      Alert.alert('Offline', 'Connect to the internet to download pending images.');
      return;
    }
    await dispatch(refreshImagesThunk());
    await reload();
  };

  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const toggleSection = (section: 'favourites' | 'expeditions' | 'study' | 'cache') => {
    setExpandedSection(current => (current === section ? null : section));
  };

  return (
    <View style={styles.screen}>
      <Header title="Offline library" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      {isLoading && !summary ? (
        <ActivityIndicator style={styles.loader} color={colors.forest} accessibilityLabel="Measuring offline storage" />
      ) : !summary ? (
        <EmptyState
          icon="alert-circle"
          title="Could not measure storage"
          description="Failed to inspect on-device storage repositories."
          actionTitle="Retry"
          onAction={() => { void reload(); }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Masthead Telemetry Panel (Finding 5) */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryHeader}>
              <View>
                <Text style={styles.telemetryCaption}>PHYSICAL MEDIA ON DISK</Text>
                <Text accessibilityRole="header" style={styles.telemetryValue}>
                  {formatBytes(summary.physicalMediaBytes)}
                </Text>
              </View>
              <Icon name="hard-drive" size={28} color={colors.forest} />
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{summary.totalUniqueFilesCount}</Text>
                <Text style={styles.metricLabel}>Unique files</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{formatBytes(summary.installedStudyTextBytes)}</Text>
                <Text style={styles.metricLabel}>Study text</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{formatBytes(summary.reclaimableMediaBytes)}</Text>
                <Text style={styles.metricLabel}>Eligible to clear</Text>
              </View>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Button
              title={isCleaning ? 'Cleaning...' : 'Clean unowned cache'}
              icon="trash-2"
              variant="outline"
              disabled={isCleaning || !preview || preview.reclaimableCount === 0 || isDownloading}
              loading={isCleaning}
              accessibilityLabel="Clean unowned discovery cache"
              onPress={handleCleanCache}
            />
            <Button
              title="Retry media"
              icon="refresh-cw"
              variant="outline"
              disabled={connection === 'offline' || isDownloading}
              loading={isDownloading}
              accessibilityLabel="Retry downloading pending offline images"
              onPress={() => { void handleRetryMedia(); }}
            />
          </View>

          {/* Categories Accordion */}
          <View style={styles.sectionContainer}>
            <Text accessibilityRole="header" style={styles.sectionHeader}>
              Storage breakdown & ownership
            </Text>

            {/* 1. Field Shelf Favourites */}
            <View style={styles.categoryCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Field Shelf favourites, ${summary.favouritesCount} items, ${formatBytes(summary.favouritesBytes)}`}
                style={styles.categoryBar}
                onPress={() => toggleSection('favourites')}
              >
                <View style={styles.categoryTitleRow}>
                  <Icon name="bookmark" size={16} color={colors.forest} />
                  <Text style={styles.categoryTitle}>Field Shelf favourites</Text>
                </View>
                <View style={styles.categoryMetaRow}>
                  <Text style={styles.categoryBytes}>
                    {summary.favouritesCount} items · {formatBytes(summary.favouritesBytes)}
                  </Text>
                  <Icon
                    name={expandedSection === 'favourites' ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </Pressable>

              {expandedSection === 'favourites' && (
                <View style={styles.itemList}>
                  {summary.items.favourites.length === 0 ? (
                    <Text style={styles.emptyText}>No favourites saved on the Field Shelf.</Text>
                  ) : (
                    summary.items.favourites.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.itemMeta}>
                            {formatBytes(item.bytes)} {item.fileName ? `· ${item.fileName}` : ''}
                          </Text>
                        </View>
                        <StatusPill status={item.status} isShared={item.isShared} />
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* 2. Expedition Packs */}
            <View style={styles.categoryCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Expedition packs, ${summary.expeditionsCount} items, ${formatBytes(summary.expeditionsBytes)}`}
                style={styles.categoryBar}
                onPress={() => toggleSection('expeditions')}
              >
                <View style={styles.categoryTitleRow}>
                  <Icon name="compass" size={16} color={colors.brass} />
                  <Text style={styles.categoryTitle}>Expedition packs</Text>
                </View>
                <View style={styles.categoryMetaRow}>
                  <Text style={styles.categoryBytes}>
                    {summary.expeditionsCount} plates · {formatBytes(summary.expeditionsBytes)}
                  </Text>
                  <Icon
                    name={expandedSection === 'expeditions' ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </Pressable>

              {expandedSection === 'expeditions' && (
                <View style={styles.itemList}>
                  {summary.items.expeditions.length === 0 ? (
                    <Text style={styles.emptyText}>No expedition plates currently installed.</Text>
                  ) : (
                    summary.items.expeditions.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.itemMeta}>
                            {formatBytes(item.bytes)} {item.fileName ? `· ${item.fileName}` : ''}
                          </Text>
                        </View>
                        <StatusPill status={item.status} isShared={item.isShared} />
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* 3. Space Study Supplements */}
            <View style={styles.categoryCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Space Study supplements, ${summary.studyCount} packs, ${formatBytes(summary.studyBytes)}`}
                style={styles.categoryBar}
                onPress={() => toggleSection('study')}
              >
                <View style={styles.categoryTitleRow}>
                  <Icon name="book-open" size={16} color={colors.forest} />
                  <Text style={styles.categoryTitle}>Space Study supplements</Text>
                </View>
                <View style={styles.categoryMetaRow}>
                  <Text style={styles.categoryBytes}>
                    {summary.studyCount} packs · {formatBytes(summary.studyBytes)}
                  </Text>
                  <Icon
                    name={expandedSection === 'study' ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </Pressable>

              {expandedSection === 'study' && (
                <View style={styles.itemList}>
                  {summary.items.study.length === 0 ? (
                    <Text style={styles.emptyText}>No external Space Study supplements installed.</Text>
                  ) : (
                    summary.items.study.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.itemMeta}>{item.ownershipReason}</Text>
                        </View>
                        <StatusPill status={item.status} isShared={item.isShared} />
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* 4. Unowned Feed Cache */}
            <View style={styles.categoryCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Discovery feed cache, ${summary.cacheCount} items, ${formatBytes(summary.cacheBytes)}`}
                style={styles.categoryBar}
                onPress={() => toggleSection('cache')}
              >
                <View style={styles.categoryTitleRow}>
                  <Icon name="layers" size={16} color={colors.terracotta} />
                  <Text style={styles.categoryTitle}>Discovery feed cache</Text>
                </View>
                <View style={styles.categoryMetaRow}>
                  <Text style={styles.categoryBytes}>
                    {summary.cacheCount} items · {formatBytes(summary.cacheBytes)}
                  </Text>
                  <Icon
                    name={expandedSection === 'cache' ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </Pressable>

              {expandedSection === 'cache' && (
                <View style={styles.itemList}>
                  {summary.items.cache.length === 0 ? (
                    <Text style={styles.emptyText}>Feed cache is clean. No unowned items stored.</Text>
                  ) : (
                    summary.items.cache.slice(0, 20).map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.itemMeta}>
                            {formatBytes(item.bytes)} · Eligible for cleanup
                          </Text>
                        </View>
                        <StatusPill status={item.status} isShared={item.isShared} />
                      </View>
                    ))
                  )}
                  {summary.items.cache.length > 20 && (
                    <Text style={styles.moreNote}>
                      + {summary.items.cache.length - 20} more unowned cached items
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  content: { gap: spacing[4], paddingHorizontal: layout.horizontalInset, paddingVertical: spacing[4] },
  loader: { marginTop: spacing[6] },
  telemetryCard: {
    backgroundColor: colors.surface,
    padding: spacing[3],
    borderRadius: radii.sm,
    borderTopWidth: 3,
    borderColor: colors.forest,
    gap: spacing[3],
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryCaption: { ...typography.label, fontSize: 11, color: colors.muted },
  telemetryValue: { ...typography.displayXL, color: colors.forest, marginTop: 2 },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing[2],
  },
  metricItem: { gap: 2 },
  metricNumber: { ...typography.h2, color: colors.ink },
  metricLabel: { ...typography.bodySmall, color: colors.muted },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sectionContainer: { gap: spacing[2] },
  sectionHeader: { ...typography.h2, color: colors.ink, marginBottom: spacing[1] },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  categoryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    minHeight: layout.minimumTouchTarget,
  },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  categoryTitle: { ...typography.label, color: colors.ink },
  categoryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  categoryBytes: { ...typography.bodySmall, color: colors.muted },
  itemList: {
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing[2],
    backgroundColor: colors.ivory,
    gap: spacing[2],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemInfo: { flex: 1, marginRight: spacing[2] },
  itemTitle: { ...typography.label, color: colors.ink },
  itemMeta: { ...typography.bodySmall, color: colors.muted, marginTop: 2 },
  pillContainer: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  pill: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  pillText: { ...typography.label, fontSize: 9 },
  emptyText: { ...typography.bodySmall, color: colors.muted, padding: spacing[2], fontStyle: 'italic' },
  moreNote: { ...typography.bodySmall, color: colors.muted, textAlign: 'center', paddingVertical: spacing[1] },
});
