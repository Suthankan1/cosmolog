import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import {
  deleteObservation,
  getObservationById,
  updateObservation,
  type ObservationRecord,
} from '../../src/database/repositories/observationsRepository';
import { useVoiceToText } from '../../src/hooks/useVoiceToText';
import { useAppSelector } from '../../src/store';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';

export default function ObservationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id;
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [observation, setObservation] = useState<ObservationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editTargetName, setEditTargetName] = useState('');
  const [editConditions, setEditConditions] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (userId && id) {
      void getObservationById(userId, id).then(record => {
        if (!active) return;
        setObservation(record);
        if (record) {
          setEditTitle(record.title);
          setEditTargetName(record.targetName ?? '');
          setEditConditions(record.conditions ?? '');
          setEditNotes(record.notes);
        }
        setLoading(false);
      }).catch(() => {
        if (!active) return;
        setObservation(null);
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [userId, id]);

  // Voice dictation in edit mode
  const baseNotesRef = useRef('');
  const {
    isListening,
    startListening,
    stopListening,
  } = useVoiceToText({
    onTranscriptChange: (utterance, isFinal) => {
      const base = baseNotesRef.current.trim();
      const combined = base ? `${base} ${utterance}` : utterance;
      const bounded = combined.slice(0, 5000);
      setEditNotes(bounded);

      if (isFinal) {
        baseNotesRef.current = bounded;
      }
    },
    onError: msg => {
      setError(msg);
    },
    continuous: true,
    addsPunctuation: true,
    preferOffline: true,
  });

  const toggleDictation = async () => {
    setError(null);
    if (isListening) {
      stopListening();
      baseNotesRef.current = editNotes;
    } else {
      baseNotesRef.current = editNotes;
      await startListening();
    }
  };

  const handleUpdate = async () => {
    if (!user?.id || !id) return;

    if (!editTitle.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!editNotes.trim()) {
      setError('Notes cannot be empty.');
      return;
    }

    if (isListening) stopListening();

    setSaving(true);
    setError(null);
    try {
      const updated = await updateObservation(user.id, id, {
        title: editTitle.trim(),
        targetName: editTargetName.trim() || null,
        conditions: editConditions.trim() || null,
        notes: editNotes.trim(),
      });

      if (updated) {
        setObservation(updated);
        setEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update observation.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user?.id || !id) return;

    Alert.alert(
      'Delete observation',
      'Are you sure you want to permanently delete this observation record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteObservation(user.id, id);
            if (success) {
              router.back();
            } else {
              Alert.alert('Error', 'Could not delete observation.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Observation" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading observation...</Text>
        </View>
      </View>
    );
  }

  if (!observation) {
    return (
      <View style={styles.screen}>
        <Header title="Observation Not Found" showBack />
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={32} color={colors.muted} />
          <Text style={styles.notFoundTitle}>Observation Not Found</Text>
          <Text style={styles.notFoundBody}>
            This record may have been deleted or belongs to a different account.
          </Text>
          <Button
            title="Return to fieldwork"
            icon="arrow-left"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const formattedDate = new Date(observation.observedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <Header
        title={editing ? 'Edit Observation' : (observation.targetName || 'Observation')}
        showBack
      />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-triangle" size={15} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* VIEW MODE */}
        {!editing ? (
          <View style={styles.viewCard}>
            <View style={styles.metaRow}>
              <View style={styles.targetBadge}>
                <Icon name="crosshair" size={12} color={colors.forest} />
                <Text style={styles.targetBadgeText}>
                  {(observation.targetName || observation.targetId || 'GENERAL SKY').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>

            <Text accessibilityRole="header" style={styles.detailTitle}>{observation.title}</Text>

            {observation.conditions ? (
              <View style={styles.conditionsBox}>
                <Icon name="cloud" size={14} color={colors.forest} />
                <Text style={styles.conditionsContent}>
                  Sky Conditions: {observation.conditions}
                </Text>
              </View>
            ) : null}

            <Text style={styles.notesBody}>{observation.notes}</Text>

            <View style={styles.provenanceBox}>
              <Text style={styles.provenanceLabel}>RECORD PROVENANCE</Text>
              <Text style={styles.provenanceText}>Recorded timezone: {observation.timezone}</Text>
              <Text style={styles.provenanceText}>Observed UTC: {observation.observedAt}</Text>
            </View>

            {/* Cross Links if present */}
            {observation.linkedDiscoveryId && (
              <Button
                title="View linked Discovery plate"
                icon="external-link"
                variant="outline"
                onPress={() => {
                  const parts = observation.linkedDiscoveryId?.split(':') ?? [];
                  const src = parts[0] ?? 'nasa-apod';
                  const extId = parts.slice(1).join(':');
                  router.push(`/details/${src}/${extId}` as never);
                }}
              />
            )}

            {observation.linkedStudyId && (
              <Button
                title="View linked Space Study guide"
                icon="book-open"
                variant="outline"
                onPress={() => router.push(`/study/${observation.linkedStudyId}` as never)}
              />
            )}

            {/* Actions: Edit & Delete */}
            <View style={styles.buttonRow}>
              <Button
                title="Edit observation"
                icon="edit-2"
                variant="outline"
                accessibilityLabel="Edit this observation record"
                onPress={() => setEditing(true)}
              />
              <Button
                title="Delete observation"
                icon="trash-2"
                variant="outline"
                accessibilityLabel="Delete this observation record"
                onPress={handleDelete}
              />
            </View>
          </View>
        ) : (
          /* EDIT MODE */
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observation Title *</Text>
              <TextInput
                accessibilityLabel="Observation Title input"
                value={editTitle}
                onChangeText={setEditTitle}
                maxLength={200}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Object (Optional)</Text>
              <TextInput
                accessibilityLabel="Target Object input"
                value={editTargetName}
                onChangeText={setEditTargetName}
                maxLength={100}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Site & Sky Conditions (Optional)</Text>
              <TextInput
                accessibilityLabel="Site and Sky Conditions input"
                value={editConditions}
                onChangeText={setEditConditions}
                maxLength={200}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.notesHeaderRow}>
                <Text style={styles.label}>Fieldwork Notes *</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isListening ? 'Stop voice dictation' : 'Dictate observation notes'}
                  style={[styles.dictateBtn, isListening && styles.dictateBtnActive]}
                  onPress={() => void toggleDictation()}
                >
                  <Icon name="mic" size={13} color={isListening ? colors.ivory : colors.forest} />
                  <Text style={[styles.dictateText, isListening && styles.dictateTextActive]}>
                    {isListening ? 'Listening...' : 'Dictate notes'}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                accessibilityLabel="Fieldwork Notes input"
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={5000}
                style={styles.textArea}
              />
              <Text style={styles.characterCount}>{editNotes.length} / 5000</Text>
            </View>

            <View style={styles.buttonRow}>
              <Button
                title={saving ? 'Saving...' : 'Save changes'}
                icon="check"
                variant="primary"
                loading={saving}
                disabled={saving}
                accessibilityLabel="Save updated observation"
                onPress={() => void handleUpdate()}
              />
              <Button
                title="Cancel"
                icon="x"
                variant="outline"
                disabled={saving}
                accessibilityLabel="Cancel editing and revert"
                onPress={() => {
                  setEditing(false);
                  setEditTitle(observation.title);
                  setEditTargetName(observation.targetName ?? '');
                  setEditConditions(observation.conditions ?? '');
                  setEditNotes(observation.notes);
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[2],
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  notFoundTitle: {
    ...typography.h2,
    color: colors.forest,
  },
  notFoundBody: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  viewCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateText: {
    ...typography.meta,
    color: colors.muted,
  },
  detailTitle: {
    ...typography.h1,
    color: colors.forest,
  },
  conditionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ivory,
    padding: spacing[2],
    borderRadius: radii.sm,
  },
  conditionsContent: {
    ...typography.bodySmall,
    color: colors.forest,
  },
  notesBody: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
  provenanceBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
    gap: 2,
  },
  provenanceLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  provenanceText: {
    ...typography.meta,
    color: colors.muted,
  },
  buttonRow: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  editForm: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  inputGroup: {
    gap: spacing[1],
  },
  label: {
    ...typography.label,
    color: colors.ink,
  },
  textInput: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    ...typography.body,
    color: colors.ink,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dictateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.sageLight,
    minHeight: 32,
  },
  dictateBtnActive: {
    backgroundColor: colors.terracotta,
  },
  dictateText: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
  },
  dictateTextActive: {
    color: colors.ivory,
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing[3],
    ...typography.body,
    color: colors.ink,
  },
  characterCount: {
    ...typography.meta,
    color: colors.muted,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBF0EB',
    padding: spacing[2],
    borderRadius: radii.sm,
    marginBottom: spacing[3],
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
});
