import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import {
  getObservations,
  type ObservationRecord,
} from '../../src/database/repositories/observationsRepository';
import { useAppSelector } from '../../src/store';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function FieldworkHubScreen() {
  const router = useRouter();
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id;
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const records = await getObservations(userId);
      setObservations(records);
    } catch {
      setObservations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const renderItem = ({ item }: { item: ObservationRecord }) => {
    const formattedDate = new Date(item.observedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Observation: ${item.title}, dated ${formattedDate}`}
        accessibilityHint="Navigates to observation details"
        style={({ pressed }) => [styles.observationCard, pressed && styles.cardPressed]}
        onPress={() => router.push(`/fieldwork/${item.id}` as never)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.targetBadge}>
            <Icon name="crosshair" size={12} color={colors.forest} />
            <Text style={styles.targetBadgeText}>
              {(item.targetName || item.targetId || 'GENERAL SKY').toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerRightRow}>
            {item.instrumentSnapshot ? (
              <Icon name="compass" size={13} color={colors.forest} style={styles.badgeIcon} />
            ) : null}
            {item.imageFileName ? (
              <Icon name="camera" size={13} color={colors.terracotta} style={styles.badgeIcon} />
            ) : null}
            {item.latitude != null ? (
              <Icon name="map-pin" size={13} color={colors.brass} style={styles.badgeIcon} />
            ) : null}
            <Text style={styles.dateMeta}>{formattedDate}</Text>
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.cardTitle}>{item.title}</Text>

        {item.conditions ? (
          <Text style={styles.conditionsText} numberOfLines={1}>
            Conditions: {item.conditions}
          </Text>
        ) : null}

        <Text style={styles.notesSnippet} numberOfLines={2}>
          {item.notes}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.timezoneMeta}>
            Recorded: {item.timezone}
          </Text>
          <Icon name="chevron-right" size={16} color={colors.forest} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <Header title="Fieldwork Journal" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <FlatList
        data={observations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.masthead}>
            <Text style={styles.kicker}>INDEPENDENT ASTRONOMICAL RECORDS · F05</Text>
            <Text accessibilityRole="header" style={styles.title}>Observational Fieldwork</Text>
            <Text style={styles.summary}>
              Account-isolated logbook for celestial eyepiece observations, night sky conditions, and fieldwork field notes.
            </Text>

            <View style={styles.actionRow}>
              <Button
                title="New observation"
                icon="plus"
                variant="primary"
                accessibilityLabel="Create a new astronomical observation record"
                onPress={() => router.push('/fieldwork/create' as never)}
              />
              <Button
                title="Field instrument"
                icon="compass"
                variant="outline"
                accessibilityLabel="Open celestial field instrument"
                onPress={() => router.push('/fieldwork/instrument' as never)}
              />
              <Button
                title="Sky timeline"
                icon="calendar"
                variant="outline"
                accessibilityLabel="Open Personal Sky Timeline"
                onPress={() => router.push('/timeline' as never)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Icon name="edit-3" size={36} color={colors.muted} />
              <Text style={styles.emptyTitle}>No field observations recorded</Text>
              <Text style={styles.emptyBody}>
                Log your telescopic sessions, sky clarity reports, and naked-eye targets. Records remain saved locally in offline storage.
              </Text>
              <Button
                title="Record first observation"
                icon="plus"
                variant="outline"
                accessibilityLabel="Create your first field observation"
                onPress={() => router.push('/fieldwork/create' as never)}
              />
            </View>
          ) : undefined
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
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  masthead: {
    marginBottom: spacing[4],
  },
  kicker: {
    ...typography.label,
    color: colors.terracotta,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    ...typography.h1,
    color: colors.forest,
    marginBottom: 4,
  },
  summary: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing[4],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
    marginBottom: spacing[2],
  },
  observationCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[3],
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
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  targetBadgeText: {
    ...typography.label,
    fontSize: 10,
    color: colors.forest,
  },
  dateMeta: {
    ...typography.meta,
    color: colors.muted,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginRight: 6,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.forest,
    marginBottom: 4,
  },
  conditionsText: {
    ...typography.meta,
    color: colors.brass,
    marginBottom: 4,
  },
  notesSnippet: {
    ...typography.bodySmall,
    color: colors.ink,
    lineHeight: 18,
    marginBottom: spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
  timezoneMeta: {
    ...typography.meta,
    color: colors.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    gap: spacing[3],
    marginTop: spacing[4],
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.forest,
  },
  emptyBody: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
});
