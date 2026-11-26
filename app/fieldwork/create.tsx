import React, { useRef, useState } from 'react';
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
  createObservation,
} from '../../src/database/repositories/observationsRepository';
import { useVoiceToText } from '../../src/hooks/useVoiceToText';
import { useAppSelector } from '../../src/store';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';

export default function CreateObservationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetId?: string;
    targetName?: string;
    linkedDiscoveryId?: string;
    linkedStudyId?: string;
  }>();

  const { user } = useAppSelector(state => state.auth);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [title, setTitle] = useState('');
  const [targetName, setTargetName] = useState(params.targetName ?? '');
  const [targetId] = useState(params.targetId ?? '');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dictation
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
      setNotes(bounded);

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
      baseNotesRef.current = notes;
    } else {
      baseNotesRef.current = notes;
      await startListening();
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Authentication required', 'Please sign in to record observations.');
      return;
    }

    if (!title.trim()) {
      setError('Observation title is required.');
      return;
    }

    if (!notes.trim()) {
      setError('Observation notes are required.');
      return;
    }

    if (isListening) {
      stopListening();
    }

    setSaving(true);
    setError(null);

    try {
      await createObservation(user.id, {
        title: title.trim(),
        notes: notes.trim(),
        targetId: targetId.trim() || undefined,
        targetName: targetName.trim() || undefined,
        conditions: conditions.trim() || undefined,
        linkedDiscoveryId: params.linkedDiscoveryId,
        linkedStudyId: params.linkedStudyId,
      });

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save observation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <Header title="New Observation" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.masthead}>
          <Text style={styles.kicker}>FIELDWORK LOGBOOK</Text>
          <Text accessibilityRole="header" style={styles.title}>Record Observation</Text>
          <Text style={styles.summary}>
            Record eyepiece observations, celestial coordinates, and observing site conditions.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-triangle" size={15} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observation Title *</Text>
          <TextInput
            accessibilityLabel="Observation Title input"
            placeholder="e.g. Saturn Ring Shadow & Titan"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            style={styles.textInput}
          />
        </View>

        {/* Target Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Object (Optional)</Text>
          <TextInput
            accessibilityLabel="Target Object input"
            placeholder="e.g. Saturn, M31, Lunar Terminator"
            placeholderTextColor={colors.muted}
            value={targetName}
            onChangeText={setTargetName}
            maxLength={100}
            style={styles.textInput}
          />
        </View>

        {/* Conditions */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Site & Sky Conditions (Optional)</Text>
          <TextInput
            accessibilityLabel="Site and Sky Conditions input"
            placeholder="e.g. Clear, Bortle 4, Transparency 4/5"
            placeholderTextColor={colors.muted}
            value={conditions}
            onChangeText={setConditions}
            maxLength={200}
            style={styles.textInput}
          />
        </View>

        {/* Notes Input + Voice Dictation Header */}
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
            placeholder="Record eyepiece visual details, magnification used, seeing stability, filters, and personal observations..."
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={5000}
            style={styles.textArea}
          />
          <Text style={styles.characterCount}>{notes.length} / 5000</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button
            title={saving ? 'Saving...' : 'Save observation'}
            icon="check"
            variant="primary"
            loading={saving}
            disabled={saving}
            accessibilityLabel="Save observation to durable local storage"
            onPress={() => void handleSave()}
          />
        </View>
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
  inputGroup: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.label,
    color: colors.ink,
    marginBottom: spacing[1],
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
    marginBottom: spacing[1],
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
    marginTop: 4,
  },
  actionRow: {
    marginTop: spacing[2],
  },
});
