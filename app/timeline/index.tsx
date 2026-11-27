import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Icon, type FeatherIconName } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { FilterChip } from '../../src/components/common/FilterChip';
import { Button } from '../../src/components/common/Button';
import { useAppSelector } from '../../src/store';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import {
  getTimelineItems,
} from '../../src/features/timeline/timelineRepository';
import {
  formatTimelineItemSubtitle,
  groupTimelineByDate,
} from '../../src/features/timeline/timelineGrouping';
import {
  TimelineFilter,
  TimelineGroup,
  TimelineItem,
} from '../../src/features/timeline/types';

export default function TimelineScreen() {
  const router = useRouter();
  const accountId = useAppSelector(state => state.auth.user?.id);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = Object.values(metadata).flatMap(source => source.lastSyncedAt ?? []).sort().at(-1) ?? legacySyncedAt;

  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isFresh = true, cursorParam?: string | null) => {
    if (!accountId) return;
    if (isFresh) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await getTimelineItems({
        accountId,
        filter,
        limit: 30,
        cursor: isFresh ? null : (cursorParam ?? null),
      });

      if (isFresh) {
        setItems(result.items);
      } else {
        setItems(prev => [...prev, ...result.items]);
      }
      setNextCursor(result.nextCursor);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load timeline');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [accountId, filter]);

  // Reload when screen focuses or filter changes
  useFocusEffect(
    useCallback(() => {
      void loadData(true);
    }, [loadData])
  );

  const loadEarlier = useCallback(() => {
    if (nextCursor && !loadingMore) {
      void loadData(false, nextCursor);
    }
  }, [loadData, nextCursor, loadingMore]);

  const sections = useMemo(() => {
    return groupTimelineByDate(items);
  }, [items]);

  const handleItemPress = (item: TimelineItem) => {
    try {
      if (item.kind === 'observation') {
        router.push(`/fieldwork/${item.sourceRecordId}` as never);
      } else if (item.kind === 'discovery_saved' || item.kind === 'reading_history') {
        const source = item.metadata?.source || 'nasa-apod';
        const externalId = item.routeRef.params?.id || item.sourceRecordId;
        router.push(`/details/${encodeURIComponent(source)}/${encodeURIComponent(externalId)}` as never);
      } else if (item.kind === 'study_bookmark') {
        router.push(`/study/${item.sourceRecordId}` as never);
      }
    } catch {
      // Fallback if record is missing
    }
  };

  const getKindConfig = (kind: TimelineItem['kind']): { icon: FeatherIconName; color: string; badgeBg: string } => {
    switch (kind) {
      case 'observation':
        return { icon: 'crosshair', color: colors.forest, badgeBg: colors.sageLight };
      case 'discovery_saved':
        return { icon: 'bookmark', color: colors.brass, badgeBg: '#F5EEDB' };
      case 'reading_history':
        return { icon: 'book-open', color: colors.forest, badgeBg: colors.sageLight };
      case 'study_bookmark':
        return { icon: 'file-text', color: colors.terracotta, badgeBg: '#F9ECE8' };
    }
  };

  const renderTimelineItem = ({ item }: { item: TimelineItem }) => {
    const { icon, color, badgeBg } = getKindConfig(item.kind);
    const subtitle = formatTimelineItemSubtitle(item);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.label}: ${item.title}. ${subtitle}`}
        accessibilityHint="Navigates to record details"
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Icon name={icon} size={12} color={color} />
            <Text style={[styles.badgeText, { color }]}>{item.label}</Text>
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.cardTitle}>{item.title}</Text>

        <Text style={styles.subtitleText} numberOfLines={2}>
          {subtitle}
        </Text>

        {item.summary ? (
          <Text style={styles.summaryText} numberOfLines={2}>
            {item.summary}
          </Text>
        ) : null}

        {item.metadata?.note ? (
          <View style={styles.notePreview}>
            <Icon name="edit-3" size={12} color={colors.forest} style={styles.noteIcon} />
            <Text style={styles.noteText} numberOfLines={2}>
              {item.metadata.note}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          {item.metadata?.locationName || item.metadata?.targetName ? (
            <Text style={styles.targetMeta} numberOfLines={1}>
              {item.metadata.locationName || item.metadata.targetName}
            </Text>
          ) : <View />}
          <Icon name="chevron-right" size={15} color={colors.forest} />
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: TimelineGroup }) => (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCountBadge}>
        <Text style={styles.sectionCountText}>{section.items.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Header title="Sky Timeline" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <SectionList
        sections={sections.map(g => ({ ...g, data: g.items }))}
        keyExtractor={item => item.id}
        renderItem={renderTimelineItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.masthead}>
            <Text style={styles.kicker}>PERSONAL SKY TIMELINE · F09</Text>
            <Text accessibilityRole="header" style={styles.title}>Your Cosmic Journey</Text>
            <Text style={styles.summary}>
              Chronological chronicle of your eyepiece observations, saved dispatches, reading history, and study bookmarks.
            </Text>

            <View style={styles.filtersContainer}>
              <FilterChip
                title="All"
                selected={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              <FilterChip
                title="Observations"
                selected={filter === 'observations'}
                onPress={() => setFilter('observations')}
              />
              <FilterChip
                title="Saved"
                selected={filter === 'saved'}
                onPress={() => setFilter('saved')}
              />
              <FilterChip
                title="Reading"
                selected={filter === 'reading'}
                onPress={() => setFilter('reading')}
              />
              <FilterChip
                title="Study"
                selected={filter === 'study'}
                onPress={() => setFilter('study')}
              />
            </View>

            {totalCount > 0 && (
              <Text accessibilityLiveRegion="polite" style={styles.counterMeta}>
                Showing {items.length} of {totalCount} records
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          nextCursor ? (
            <View style={styles.footerLoader}>
              <Button
                title={loadingMore ? 'Loading earlier records…' : 'Load earlier records'}
                variant="outline"
                loading={loadingMore}
                onPress={loadEarlier}
              />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              accessibilityLabel="Loading cosmic journey timeline"
              color={colors.forest}
              style={styles.centerSpinner}
            />
          ) : error ? (
            <EmptyState
              icon="alert-circle"
              title="Could not open timeline"
              description={error}
              actionTitle="Try again"
              onAction={() => void loadData(true)}
            />
          ) : (
            <EmptyState
              icon="calendar"
              title="No journey records found"
              description={
                filter === 'all'
                  ? 'Record an astronomical observation, save a dispatch, or mark a study entry to build your cosmic timeline.'
                  : 'No records found for the selected filter.'
              }
              actionTitle={filter !== 'all' ? 'Show all records' : 'Explore dispatches'}
              onAction={
                filter !== 'all'
                  ? () => setFilter('all')
                  : () => router.navigate('/(tabs)/discover')
              }
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  masthead: {
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing[4],
  },
  kicker: {
    ...typography.meta,
    color: colors.brass,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing[1],
  },
  title: {
    ...typography.h1,
    color: colors.forest,
    marginBottom: spacing[2],
  },
  summary: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginVertical: spacing[2],
  },
  counterMeta: {
    ...typography.meta,
    color: colors.muted,
    marginTop: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    marginBottom: spacing[2],
    paddingBottom: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 16,
    color: colors.forest,
  },
  sectionCountBadge: {
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  sectionCountText: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[3],
    minHeight: 48,
  },
  cardPressed: {
    backgroundColor: colors.sageLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  badgeText: {
    ...typography.label,
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    ...typography.h2,
    fontSize: 16,
    color: colors.forest,
    marginBottom: 4,
  },
  subtitleText: {
    ...typography.meta,
    color: colors.brass,
    marginBottom: spacing[2],
  },
  summaryText: {
    ...typography.bodySmall,
    color: colors.ink,
    lineHeight: 18,
    marginBottom: spacing[2],
  },
  notePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.sageLight,
    padding: spacing[2],
    borderRadius: radii.sm,
    marginBottom: spacing[2],
  },
  noteIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  noteText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    color: colors.forest,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
  targetMeta: {
    ...typography.meta,
    color: colors.muted,
    flex: 1,
  },
  centerSpinner: {
    marginVertical: spacing[8],
  },
  footerLoader: {
    marginVertical: spacing[4],
  },
});
