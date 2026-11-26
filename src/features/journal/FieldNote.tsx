import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { Button } from '../../components/common/Button';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { NOTE_LIMIT } from '../../database/repositories/favouritesRepository';
import { useVoiceToText } from '../../hooks/useVoiceToText';

export function FieldNote({
  note,
  onSave,
}: {
  note: string | null;
  onSave: (text: string | null) => Promise<void>;
}) {
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState(note ?? '');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks the committed text prior to the currently active spoken utterance
  const baseTextRef = useRef('');

  const {
    isListening,
    error: voiceError,
    startListening,
    stopListening,
    clearError: clearVoiceError,
  } = useVoiceToText({
    onTranscriptChange: (utterance, isFinal) => {
      const base = baseTextRef.current.trim();
      const combined = base ? `${base} ${utterance}` : utterance;
      const bounded = combined.slice(0, NOTE_LIMIT);
      setDraft(bounded);

      if (isFinal) {
        baseTextRef.current = bounded;
      }
    },
    onError: (msg) => {
      setError(msg);
    },
    continuous: true,
    addsPunctuation: true,
    preferOffline: true, // Offline-first twist: use on-device models where supported
  });

  const handleStartDictation = async () => {
    setError(null);
    clearVoiceError();
    baseTextRef.current = draft;
    await startListening();
  };

  const handleStopDictation = () => {
    stopListening();
    baseTextRef.current = draft;
  };

  const submit = async (text: string | null) => {
    if (busy) return;
    if (isListening) {
      handleStopDictation();
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(text);
      setEditing(false);
    } catch {
      setError('Could not save the change. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    if (busy) return;
    if (isListening) {
      handleStopDictation();
    }
    setEditing(false);
    setError(null);
  };

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>
        My field note
      </Text>
      <Text style={styles.body}>
        {note || 'Add a private note for the next time you read this.'}
      </Text>
      <View style={styles.actions}>
        <Button
          title={note ? 'Edit note' : 'Add a note'}
          variant="outline"
          icon="edit-3"
          disabled={busy}
          onPress={() => {
            setDraft(note ?? '');
            baseTextRef.current = note ?? '';
            setError(null);
            setEditing(true);
          }}
          testID="field-note-open"
        />
        {note && (
          <Button
            title="Remove note"
            variant="danger"
            loading={busy}
            onPress={() => {
              Alert.alert('Remove this note?', 'The discovery will stay in Favourites.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    void submit(null);
                  },
                },
              ]);
            }}
          />
        )}
      </View>
      {!editing && error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      <Modal
        visible={editing}
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={cancel}
      >
        <SafeAreaView style={styles.editor}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.editor}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editorContent}
            >
              <Text accessibilityRole="header" style={styles.heading}>
                My field note
              </Text>
              <Text style={styles.body}>
                This note stays on your device for this account.
              </Text>

              {/* Voice Dictation Control Bar */}
              <View style={styles.dictationRow}>
                <Button
                  title={isListening ? 'Stop dictating' : 'Dictate observation'}
                  variant={isListening ? 'danger' : 'outline'}
                  icon="mic"
                  disabled={busy}
                  onPress={isListening ? handleStopDictation : handleStartDictation}
                  testID="field-note-dictate"
                />
                {isListening && (
                  <View style={styles.listeningBadge}>
                    <Text style={styles.listeningText}>Listening...</Text>
                  </View>
                )}
              </View>

              <TextInput
                multiline
                autoFocus={!isListening}
                maxLength={NOTE_LIMIT}
                value={draft}
                onChangeText={(text) => {
                  setDraft(text);
                  baseTextRef.current = text;
                }}
                editable={!busy}
                accessibilityLabel="Field note"
                style={[styles.input, isListening && styles.inputListening]}
                textAlignVertical="top"
                placeholder={
                  isListening
                    ? 'Speak observation notes clearly...'
                    : 'What would you like to remember?'
                }
                placeholderTextColor={isListening ? colors.forest : colors.muted}
                testID="field-note-input"
              />
              <Text style={styles.counter}>
                {draft.length} / {NOTE_LIMIT}
              </Text>

              {(error || voiceError) && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error || voiceError}
                </Text>
              )}

              <View style={styles.actions}>
                <Button title="Cancel" variant="outline" disabled={busy} onPress={cancel} />
                <Button
                  title="Save note"
                  loading={busy}
                  disabled={!draft.trim()}
                  onPress={() => {
                    void submit(draft);
                  }}
                  testID="field-note-save"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { flex: 1, backgroundColor: colors.ivory },
  editorContent: { gap: spacing[3], padding: spacing[6] },
  card: { gap: spacing[3], borderRadius: radii.lg, padding: spacing[4], backgroundColor: colors.sageLight },
  heading: { ...typography.h2, color: colors.forest },
  body: { ...typography.body, color: colors.ink },
  dictationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  listeningBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.sageLight,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.forest,
  },
  listeningText: {
    ...typography.bodySmall,
    color: colors.forest,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing[3],
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.forest,
  },
  inputListening: {
    borderColor: colors.terracotta,
    borderWidth: 1.5,
    backgroundColor: colors.ivory,
  },
  counter: { ...typography.bodySmall, color: colors.muted, textAlign: 'right' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  error: { ...typography.bodySmall, color: colors.danger },
});

export default FieldNote;
