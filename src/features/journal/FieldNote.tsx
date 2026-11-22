import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { Button } from '../../components/common/Button';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { NOTE_LIMIT } from '../../database/repositories/favouritesRepository';

export function FieldNote({ note, onSave }: { note: string | null; onSave: (text: string | null) => Promise<void> }) {
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState(note ?? '');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (text: string | null) => {
    if (busy) return;
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
    setEditing(false);
    setError(null);
  };

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>My field note</Text>
      <Text style={styles.body}>{note || 'Add a private note for the next time you read this.'}</Text>
      <View style={styles.actions}>
        <Button title={note ? 'Edit note' : 'Add a note'} variant="outline" icon="edit-3" disabled={busy} onPress={() => {
          setDraft(note ?? '');
          setError(null);
          setEditing(true);
        }} />
        {note && (
          <Button title="Remove note" variant="danger" loading={busy} onPress={() => {
            Alert.alert('Remove this note?', 'The discovery will stay in Favourites.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => { void submit(null); } },
            ]);
          }} />
        )}
      </View>
      {!editing && error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Modal visible={editing} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={cancel}>
        <SafeAreaView style={styles.editor}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.editor}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.editorContent}>
              <Text accessibilityRole="header" style={styles.heading}>My field note</Text>
              <Text style={styles.body}>This note stays on your device for this account.</Text>
              <TextInput
                multiline autoFocus maxLength={NOTE_LIMIT} value={draft} onChangeText={setDraft}
                editable={!busy} accessibilityLabel="Field note" style={styles.input} textAlignVertical="top"
                placeholder="What would you like to remember?" placeholderTextColor={colors.muted}
                testID="field-note-input"
              />
              <Text style={styles.counter}>{draft.length} / {NOTE_LIMIT}</Text>
              {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
              <View style={styles.actions}>
                <Button title="Cancel" variant="outline" disabled={busy} onPress={cancel} />
                <Button title="Save note" loading={busy} disabled={!draft.trim()} onPress={() => { void submit(draft); }}
                  testID="field-note-save" />
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
  input: {
    ...typography.body, color: colors.ink, backgroundColor: colors.surface, borderRadius: radii.md,
    padding: spacing[3], minHeight: 110, borderWidth: 1, borderColor: colors.forest,
  },
  counter: { ...typography.bodySmall, color: colors.muted, textAlign: 'right' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  error: { ...typography.bodySmall, color: colors.danger },
});
