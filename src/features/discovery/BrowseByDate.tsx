import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { isCalendarDate, navigateToDetails } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme/tokens';
import { APOD_ARCHIVE_START, localCalendarDate } from './plateDates';

export function BrowseByDate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState('');
  const [error, setError] = useState<string>();

  const open = () => {
    const value = date.trim();
    const today = localCalendarDate(new Date());
    if (!isCalendarDate(value) || value > today || value < APOD_ARCHIVE_START) {
      setError('Enter a date from 1995-06-16 through today (YYYY-MM-DD).');
      return;
    }
    setError(undefined);
    setExpanded(false);
    navigateToDetails(router, 'nasa-apod', value);
  };

  return (
    <>
      <Button title="Browse by date" icon="calendar" variant="outline" onPress={() => setExpanded(true)} />
      <Modal visible={expanded} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => setExpanded(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
          <ScrollView keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.form, { paddingTop: insets.top + spacing[5] }]}>
            <Text accessibilityRole="header" style={styles.title}>Browse by date</Text>
            <Text style={styles.description}>Open a plate from NASA’s astronomy archive.</Text>
            <Input label="Plate date (YYYY-MM-DD)" value={date} placeholder="2014-09-18" error={error}
              onChangeText={value => { setDate(value); setError(undefined); }} onSubmitEditing={open} />
            <Button title="Open plate" onPress={open} />
            <Button title="Cancel" variant="outline" onPress={() => setExpanded(false)} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  form: { gap: spacing[3], paddingHorizontal: spacing[6], paddingBottom: spacing[6] },
  title: { ...typography.h1, color: colors.forest },
  description: { ...typography.body, color: colors.muted },
});
