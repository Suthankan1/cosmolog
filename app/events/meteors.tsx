import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { Button } from '../../src/components/common/Button';
import { FilterChip } from '../../src/components/common/FilterChip';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { useAppSelector } from '../../src/store';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import {
  getMeteorCalendarManifest,
  getMeteorEvents,
  isManifestExpired,
} from '../../src/features/events/meteorRepository';
import {
  ZHR_EXPLANATION,
} from '../../src/features/events/meteorFormatter';
import {
  MeteorEventWithStatus,
} from '../../src/features/events/types';

export default function MeteorCalendarScreen() {
  const router = useRouter();
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = Object.values(metadata).flatMap(source => source.lastSyncedAt ?? []).sort().at(-1) ?? legacySyncedAt;

  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const manifest = useMemo(() => getMeteorCalendarManifest(), []);
  const expired = useMemo(() => isManifestExpired(), []);
  const events = useMemo(() => getMeteorEvents({ statusFilter: filter }), [filter]);

  const getStatusBadgeStyle = (status: MeteorEventWithStatus['status']) => {
    switch (status) {
      case 'active_peak':
        return { bg: '#F9ECE8', text: colors.terracotta, icon: 'zap' as const };
      case 'active':
        return { bg: colors.sageLight, text: colors.forest, icon: 'activity' as const };
      case 'upcoming':
        return { bg: '#F5EEDB', text: colors.brass, icon: 'clock' as const };
      case 'past':
        return { bg: '#EAE6DD', text: colors.muted, icon: 'check' as const };
    }
  };

  const renderMeteorCard = ({ item }: { item: MeteorEventWithStatus }) => {
    const badge = getStatusBadgeStyle(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iauBadge}>
            <Text style={styles.iauText}>{item.iauCode}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Icon name={badge.icon} size={11} color={badge.text} />
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {item.statusLabel}
            </Text>
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.cardTitle}>{item.name}</Text>

        <View style={styles.metaRow}>
          <Icon name="target" size={13} color={colors.brass} style={styles.metaIcon} />
          <Text style={styles.metaLabel}>Peak:</Text>
          <Text style={styles.metaValue}>{item.formattedPeak}</Text>
        </View>

        <View style={styles.metaRow}>
          <Icon name="calendar" size={13} color={colors.brass} style={styles.metaIcon} />
          <Text style={styles.metaLabel}>Window:</Text>
          <Text style={styles.metaValue}>{item.formattedActiveWindow}</Text>
        </View>

        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryCell}>
            <Text style={styles.telemetryHeader}>IDEAL ZHR</Text>
            <Text style={styles.telemetryData}>
              {item.zhr != null ? `~${item.zhr}/hr` : 'Variable'}
            </Text>
          </View>

          <View style={styles.telemetryCell}>
            <Text style={styles.telemetryHeader}>VELOCITY</Text>
            <Text style={styles.telemetryData}>
              {item.velocityKmS != null ? `${item.velocityKmS} km/s` : 'Unknown'}
            </Text>
          </View>

          <View style={styles.telemetryCell}>
            <Text style={styles.telemetryHeader}>RADIANT</Text>
            <Text style={styles.telemetryData} numberOfLines={1}>
              {item.radiant ? item.radiant.constellation : 'Diffused'}
            </Text>
          </View>
        </View>

        {item.parentBody ? (
          <Text style={styles.parentBodyText}>
            Parent Body: <Text style={styles.parentBodyName}>{item.parentBody}</Text>
          </Text>
        ) : null}

        <Text style={styles.guidanceText}>{item.observingGuidance}</Text>

        <View style={styles.cardActions}>
          <Button
            title="Log observation"
            icon="plus"
            variant="primary"
            accessibilityLabel={`Log observation for ${item.name} meteor shower`}
            onPress={() => {
              router.push({
                pathname: '/fieldwork/create',
                params: {
                  targetId: `meteor:${item.id}`,
                  targetName: item.name,
                  notes: `Observation of ${item.name} meteor shower (${item.iauCode}). Active radiant: ${item.radiant?.constellation || 'sky'}. Parent: ${item.parentBody || 'unknown'}.`,
                },
              } as never);
            }}
          />

          {item.skyViewerTargetId ? (
            <Button
              title="Locate radiant"
              icon="compass"
              variant="outline"
              accessibilityLabel={`Locate ${item.name} radiant in Sky Viewer`}
              onPress={() => {
                router.push({
                  pathname: '/sky-viewer',
                  params: {
                    target: item.skyViewerTargetId,
                  },
                } as never);
              }}
            />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Header title="Meteor Calendar" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderMeteorCard}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.masthead}>
            <Text style={styles.kicker}>ANNUAL ASTRONOMICAL CALENDAR · F10</Text>
            <Text accessibilityRole="header" style={styles.title}>Meteor Showers {manifest.editionYear}</Text>
            <Text style={styles.summary}>
              Authoritative annual active windows and peak estimates verified from the International Meteor Organization (IMO) and American Meteor Society (AMS).
            </Text>

            {expired && (
              <View style={styles.expiredBanner}>
                <Icon name="alert-triangle" size={16} color={colors.terracotta} />
                <Text style={styles.expiredText}>
                  This calendar edition ({manifest.editionYear}) has expired. Peak hours drift by ~6 hours annually; do not reuse without annual review.
                </Text>
              </View>
            )}

            <View style={styles.caveatBox}>
              <Icon name="info" size={15} color={colors.forest} style={styles.caveatIcon} />
              <Text style={styles.caveatText}>{ZHR_EXPLANATION}</Text>
            </View>

            <View style={styles.filtersContainer}>
              <FilterChip
                title="All Showers"
                selected={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              <FilterChip
                title="Active & Peak"
                selected={filter === 'active'}
                onPress={() => setFilter('active')}
              />
              <FilterChip
                title="Upcoming"
                selected={filter === 'upcoming'}
                onPress={() => setFilter('upcoming')}
              />
              <FilterChip
                title="Past"
                selected={filter === 'past'}
                onPress={() => setFilter('past')}
              />
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={styles.provenanceFooter}>
            <Text style={styles.provenanceTitle}>ASTRONOMICAL PROVENANCE & RIGHTS</Text>
            <Text style={styles.provenanceBody}>
              Edition {manifest.editionYear} · Reviewed on {manifest.reviewedAt}. Sourced from IMO S10 & AMS S11. Peak UTC precision respected; date-only peaks remain date-only. Pure local offline dataset; zero network tracking.
            </Text>
          </View>
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
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#F9ECE8',
    borderColor: colors.terracotta,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  expiredText: {
    ...typography.bodySmall,
    color: colors.terracotta,
    flex: 1,
    lineHeight: 18,
  },
  caveatBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  caveatIcon: {
    marginRight: spacing[2],
    marginTop: 2,
  },
  caveatText: {
    ...typography.bodySmall,
    color: colors.forest,
    flex: 1,
    lineHeight: 18,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  iauBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  iauText: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  statusBadgeText: {
    ...typography.label,
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    ...typography.h2,
    color: colors.forest,
    fontSize: 18,
    marginBottom: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaLabel: {
    ...typography.meta,
    fontWeight: '700',
    color: colors.ink,
    marginRight: 6,
  },
  metaValue: {
    ...typography.meta,
    color: colors.muted,
    flex: 1,
  },
  telemetryGrid: {
    flexDirection: 'row',
    backgroundColor: colors.ivory,
    borderRadius: radii.sm,
    padding: spacing[2],
    marginVertical: spacing[3],
    justifyContent: 'space-between',
  },
  telemetryCell: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryHeader: {
    ...typography.label,
    fontSize: 9,
    color: colors.muted,
    marginBottom: 2,
  },
  telemetryData: {
    ...typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest,
  },
  parentBodyText: {
    ...typography.bodySmall,
    color: colors.muted,
    marginBottom: spacing[2],
  },
  parentBodyName: {
    fontWeight: '600',
    color: colors.ink,
  },
  guidanceText: {
    ...typography.bodySmall,
    color: colors.ink,
    lineHeight: 18,
    marginBottom: spacing[4],
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
  },
  provenanceFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[4],
    marginTop: spacing[2],
  },
  provenanceTitle: {
    ...typography.label,
    fontSize: 10,
    color: colors.brass,
    fontWeight: '700',
    marginBottom: 4,
  },
  provenanceBody: {
    ...typography.meta,
    color: colors.muted,
    lineHeight: 16,
  },
});
