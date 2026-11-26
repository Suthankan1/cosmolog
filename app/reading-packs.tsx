import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '../src/components/common/Button';
import { EmptyState } from '../src/components/common/EmptyState';
import { Header } from '../src/components/common/Header';
import { Icon } from '../src/components/common/Icon';
import { OfflineBanner } from '../src/components/common/OfflineBanner';
import { DispatchRow } from '../src/components/discovery/DispatchRow';
import { getReadingPackItems } from '../src/database/repositories/readingPacksRepository';
import {
  getAllCompletedStepIds,
  markExpeditionStepCompleted,
  unmarkExpeditionStepCompleted,
} from '../src/database/repositories/expeditionsRepository';
import { mediaLabel } from '../src/features/discovery/mediaLabel';
import {
  downloadExpedition,
  removeExpeditionDownload,
} from '../src/features/expeditions/expeditionDownloads';
import {
  getAllExpeditions,
  type ExpeditionManifest,
} from '../src/features/expeditions/manifest';
import { useToggleFavourite } from '../src/features/journal/useToggleFavourite';
import { navigateToDetails } from '../src/navigation/types';
import { useAppDispatch, useAppSelector } from '../src/store';
import { refreshImagesThunk } from '../src/store/slices/favouritesSlice';
import { colors, layout, radii, spacing, typography } from '../src/theme/tokens';
import { formatEditorialDate } from '../src/utils/text';

type Installed = Awaited<ReturnType<typeof getReadingPackItems>>;

export default function ReadingPacksScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toggleFavourite = useToggleFavourite();
  const accountId = useAppSelector(state => state.auth.user?.id);
  const { favourites, pending, mediaRevision, isDownloading } = useAppSelector(state => state.favourites);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);

  const [result, setResult] = useState<{
    owner: number;
    items: Installed | null;
    completed: Map<string, Set<string>>;
  }>();
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState<{ packId: string; text: string }>();
  const work = useRef<AbortController | null>(null);
  const readRequest = useRef(0);

  const reload = useCallback(async (owner: number, isActive: () => boolean = () => true) => {
    const request = ++readRequest.current;
    try {
      const [items, completed] = await Promise.all([
        getReadingPackItems(owner).catch(() => null),
        getAllCompletedStepIds(owner).catch(() => new Map()),
      ]);
      if (isActive() && readRequest.current === request) {
        setResult({ owner, items, completed });
      }
    } catch {
      if (isActive() && readRequest.current === request) {
        setResult({ owner, items: null, completed: new Map() });
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (!accountId) return;
    let active = true;
    void reload(accountId, () => active);
    return () => { active = false; };
  }, [accountId, reload]));

  useEffect(() => {
    if (mediaRevision > 0 && accountId) {
      const timer = setTimeout(() => void reload(accountId), 0);
      return () => clearTimeout(timer);
    }
  }, [accountId, mediaRevision, reload]);

  useEffect(() => () => work.current?.abort(), [accountId]);

  useEffect(() => {
    if (connection === 'offline') work.current?.abort();
  }, [connection]);

  const installed = result?.owner === accountId ? result?.items : undefined;
  const completedSteps: Map<string, Set<string>> = (result?.owner === accountId && result?.completed) ? result.completed : new Map();
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;
  const allExpeditions = getAllExpeditions();

  const toggleStep = async (expeditionId: string, stepId: string) => {
    if (!accountId) return;
    const isDone = completedSteps.get(expeditionId)?.has(stepId);
    if (isDone) {
      await unmarkExpeditionStepCompleted(accountId, expeditionId, stepId);
    } else {
      await markExpeditionStepCompleted(accountId, expeditionId, stepId);
    }
    await reload(accountId);
  };

  const start = async (expedition: ExpeditionManifest) => {
    if (!accountId || work.current || busy || connection !== 'online') return;
    const controller = new AbortController();
    work.current = controller;
    setBusy(expedition.id);
    setNotice(undefined);
    try {
      const res = await downloadExpedition(
        accountId,
        expedition,
        controller.signal,
        () => reload(accountId, () => !controller.signal.aborted),
      );
      if (res.aborted) {
        setNotice({ packId: expedition.id, text: 'Download paused. Reconnect and resume to finish.' });
      } else if (res.missingSteps.length) {
        setNotice({ packId: expedition.id, text: 'Some plates could not be downloaded. Resume to retry.' });
      }
      await dispatch(refreshImagesThunk());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not prepare the expedition. Try again.';
      setNotice({ packId: expedition.id, text: message });
    } finally {
      work.current = null;
      await reload(accountId);
      setBusy(undefined);
    }
  };

  const remove = async (expedition: ExpeditionManifest) => {
    if (!accountId || busy || work.current) return;
    setBusy(expedition.id);
    setNotice(undefined);
    try {
      await removeExpeditionDownload(accountId, expedition.id);
      await reload(accountId);
      void dispatch(refreshImagesThunk());
    } catch {
      setNotice({ packId: expedition.id, text: 'Could not remove this expedition. Try again.' });
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Expedition packs" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}
      {installed === undefined ? (
        <ActivityIndicator style={styles.loading} color={colors.forest} accessibilityLabel="Loading expedition packs" />
      ) : installed === null ? (
        <EmptyState
          icon="alert-circle"
          title="Could not open expeditions"
          description="Try reading the local archive again."
          actionTitle="Try again"
          onAction={() => { if (accountId) void reload(accountId); }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {allExpeditions.map(expedition => {
            const packItems = installed.filter(item => item.packId === expedition.id);
            const discoverySteps = expedition.steps.filter(s => s.kind === 'discovery' && s.date);
            const eligible = packItems.filter(item => item.mediaStatus !== 'text-only');
            const imageCount = eligible.filter(item => item.mediaStatus === 'ready').length;
            const textReady = packItems.length >= discoverySteps.length;
            const hasWork = !textReady || imageCount < eligible.length;

            const expCompleted = completedSteps.get(expedition.id) ?? new Set<string>();
            const totalSteps = expedition.steps.length;
            const doneSteps = expCompleted.size;
            const isFinished = doneSteps >= totalSteps;

            return (
              <View key={expedition.id} style={styles.pack}>
                <View style={styles.packHeader}>
                  <Text accessibilityRole="header" style={styles.title}>{expedition.title}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.kindBadge}>GUIDED EXPEDITION</Text>
                    {isFinished && <Text style={styles.completedBadge}>COMPLETED</Text>}
                  </View>
                </View>

                <Text style={styles.copy}>{expedition.description}</Text>

                {/* Sourced provenance metadata */}
                <View style={styles.sourcesBox}>
                  <Text style={styles.sourcesLabel}>Sources & Credits:</Text>
                  {expedition.sources.map(src => (
                    <Text key={src.url} style={styles.sourceText}>
                      • {src.title} ({src.publisher})
                    </Text>
                  ))}
                </View>

                {/* Progress summary */}
                <View style={styles.progressRow}>
                  <Text accessibilityLiveRegion="polite" style={styles.status}>
                    {doneSteps} of {totalSteps} steps completed · {packItems.length} of {discoverySteps.length} plates saved
                    {eligible.length ? ' (' + imageCount + ' of ' + eligible.length + ' images ready)' : ''}
                  </Text>
                </View>

                {/* Ordered step list */}
                <View style={styles.stepList}>
                  {expedition.steps.map(step => {
                    const isStepDone = expCompleted.has(step.id);

                    if (step.kind === 'discovery') {
                      const item = packItems.find(plate => plate.externalId === step.date);
                      return (
                        <View key={step.id} style={styles.stepCard}>
                          <View style={styles.stepHeader}>
                            <View style={styles.stepTypeTag}>
                              <Icon name="image" size={14} color={colors.forest} />
                              <Text style={styles.stepTypeLabel}>CELESTIAL PLATE</Text>
                            </View>
                            <Pressable
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: isStepDone }}
                              accessibilityLabel={`Mark ${step.title} ${isStepDone ? 'incomplete' : 'complete'}`}
                              hitSlop={8}
                              style={[styles.checkbox, isStepDone && styles.checkboxActive]}
                              onPress={() => void toggleStep(expedition.id, step.id)}
                            >
                              {isStepDone && <Icon name="check" size={14} color={colors.ivory} />}
                            </Pressable>
                          </View>

                          {item ? (
                            <DispatchRow
                              item={item}
                              offline={offline}
                              availability={mediaLabel(item.mediaStatus, offline)}
                              isSaved={favourites.some(saved => saved.localId === item.localId)}
                              pending={Boolean(pending[item.localId])}
                              onPress={() => navigateToDetails(router, item.source, item.externalId)}
                              onToggleSave={() => toggleFavourite(item.localId)}
                            />
                          ) : (
                            <View style={styles.missing}>
                              <Text style={styles.entryTitle}>{step.title}</Text>
                              <Text style={styles.metadata}>
                                {step.date ? formatEditorialDate(step.date) : ''} · Not downloaded
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    }

                    if (step.kind === 'study') {
                      return (
                        <View key={step.id} style={styles.stepCard}>
                          <View style={styles.stepHeader}>
                            <View style={styles.stepTypeTag}>
                              <Icon name="book-open" size={14} color={colors.brass} />
                              <Text style={[styles.stepTypeLabel, { color: colors.brass }]}>SPACE STUDY</Text>
                            </View>
                            <Pressable
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: isStepDone }}
                              accessibilityLabel={`Mark ${step.title} ${isStepDone ? 'incomplete' : 'complete'}`}
                              hitSlop={8}
                              style={[styles.checkbox, isStepDone && styles.checkboxActive]}
                              onPress={() => void toggleStep(expedition.id, step.id)}
                            >
                              {isStepDone && <Icon name="check" size={14} color={colors.ivory} />}
                            </Pressable>
                          </View>

                          <Text style={styles.entryTitle}>{step.title}</Text>
                          <Text style={styles.stepSummary}>{step.summary}</Text>
                          {step.targetId && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Open study guide: ${step.title}`}
                              style={styles.actionPill}
                              onPress={() => router.push(`/study/${step.targetId}` as never)}
                            >
                              <Icon name="book-open" size={14} color={colors.forest} />
                              <Text style={styles.actionPillText}>Read study chapter</Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    }

                    // Field prompt step
                    return (
                      <View key={step.id} style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                          <View style={styles.stepTypeTag}>
                            <Icon name="compass" size={14} color={colors.terracotta} />
                            <Text style={[styles.stepTypeLabel, { color: colors.terracotta }]}>FIELD OBSERVATION</Text>
                          </View>
                          <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isStepDone }}
                            accessibilityLabel={`Mark ${step.title} ${isStepDone ? 'incomplete' : 'complete'}`}
                            hitSlop={8}
                            style={[styles.checkbox, isStepDone && styles.checkboxActive]}
                            onPress={() => void toggleStep(expedition.id, step.id)}
                          >
                            {isStepDone && <Icon name="check" size={14} color={colors.ivory} />}
                          </Pressable>
                        </View>

                        <Text style={styles.entryTitle}>{step.title}</Text>
                        <Text style={styles.stepSummary}>{step.summary}</Text>
                        {step.promptInstruction && (
                          <View style={styles.promptInstructionBox}>
                            <Text style={styles.promptInstructionText}>{step.promptInstruction}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Actions */}
                {hasWork && (
                  <Button
                    title={textReady ? 'Retry pack images' : packItems.length ? 'Resume download' : 'Download expedition'}
                    icon="download"
                    disabled={connection !== 'online' || Boolean(busy && busy !== expedition.id)}
                    loading={busy === expedition.id || (textReady && isDownloading)}
                    accessibilityLabel={
                      (textReady ? 'Retry images for ' : packItems.length ? 'Resume download for ' : 'Download ') +
                      expedition.title
                    }
                    onPress={() => { void start(expedition); }}
                  />
                )}
                {hasWork && offline && (
                  <Text style={styles.metadata}>Connect to download the rest of this expedition.</Text>
                )}
                {packItems.length > 0 && (
                  <Button
                    title="Remove download"
                    icon="trash-2"
                    variant="outline"
                    disabled={Boolean(busy)}
                    accessibilityLabel={'Remove download for ' + expedition.title}
                    onPress={() =>
                      Alert.alert(
                        'Remove this download?',
                        'Any favourites, field notes, and completed study bookmarks stay preserved.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => { void remove(expedition); } },
                        ],
                      )
                    }
                  />
                )}
                {notice?.packId === expedition.id && (
                  <Text accessibilityRole="alert" style={styles.error}>{notice.text}</Text>
                )}
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
  pack: {
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderTopWidth: 3,
    borderColor: colors.forest,
  },
  packHeader: { gap: spacing[1] },
  title: { ...typography.h1, color: colors.forest },
  badgeRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center', marginTop: 2 },
  kindBadge: {
    ...typography.label,
    fontSize: 10,
    color: colors.forest,
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  completedBadge: {
    ...typography.label,
    fontSize: 10,
    color: colors.ivory,
    backgroundColor: colors.forest,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  sourcesBox: {
    backgroundColor: colors.ivory,
    padding: spacing[2],
    borderRadius: radii.sm,
    gap: 2,
  },
  sourcesLabel: { ...typography.label, fontSize: 11, color: colors.muted },
  sourceText: { ...typography.bodySmall, color: colors.ink },
  progressRow: { marginVertical: spacing[1] },
  stepList: { gap: spacing[3], marginVertical: spacing[2] },
  stepCard: {
    backgroundColor: colors.ivory,
    borderRadius: radii.sm,
    padding: spacing[2],
    borderLeftWidth: 3,
    borderColor: colors.border,
    gap: spacing[1],
  },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepTypeLabel: { ...typography.label, fontSize: 10, color: colors.forest },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.forest },
  entryTitle: { ...typography.h2, color: colors.ink },
  stepSummary: { ...typography.bodySmall, color: colors.ink },
  promptInstructionBox: {
    backgroundColor: colors.surface,
    padding: spacing[2],
    borderRadius: radii.sm,
    borderLeftWidth: 2,
    borderColor: colors.terracotta,
    marginTop: 4,
  },
  promptInstructionText: { ...typography.bodySmall, color: colors.ink, fontStyle: 'italic' },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    marginTop: 4,
    minHeight: layout.minimumTouchTarget,
  },
  actionPillText: { ...typography.label, color: colors.forest },
  missing: { paddingVertical: spacing[2], gap: spacing[1] },
  copy: { ...typography.body, color: colors.ink },
  status: { ...typography.label, color: colors.forest },
  metadata: { ...typography.bodySmall, color: colors.muted },
  error: { ...typography.bodySmall, color: colors.danger },
  loading: { marginTop: spacing[5] },
});
