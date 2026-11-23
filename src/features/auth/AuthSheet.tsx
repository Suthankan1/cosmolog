import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Earthrise } from '../../components/common/Earthrise';
import { colors, layout, spacing, typography } from '../../theme/tokens';

export function AuthSheet({ title, subtitle, error, register, children }: {
  title: string;
  subtitle: string;
  error: string | null;
  register?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={[styles.masthead, { paddingTop: insets.top + spacing[3] }, register && styles.compact]}>
          {!register && <Earthrise style={styles.photo} />}
          <Image source={require('../../../assets/brand/cosmolog-lockup-ivory.svg')} style={styles.wordmark}
            contentFit="contain" accessibilityLabel="COSMOLOG" accessible />
        </View>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[6] }]}>
          <View style={styles.form}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthLink({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.link}>
      <Text style={styles.linkLabel}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDark },
  scroll: { flexGrow: 1 },
  masthead: {
    backgroundColor: colors.forestDark, paddingHorizontal: layout.horizontalInset, paddingBottom: 132, alignItems: 'center',
  },
  compact: { paddingBottom: spacing[8] },
  photo: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 128 },
  wordmark: { width: '100%', maxWidth: 460, aspectRatio: 717 / 102, marginVertical: spacing[3] },
  sheet: {
    flex: 1, backgroundColor: colors.ivory, borderTopWidth: 3, borderColor: colors.terracotta,
    paddingTop: spacing[6], paddingHorizontal: layout.horizontalInset,
  },
  form: { width: '100%', maxWidth: 500, alignSelf: 'center' },
  title: { ...typography.display, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing[5], marginTop: spacing[1] },
  error: {
    ...typography.body, color: colors.danger, backgroundColor: colors.surface, padding: spacing[3], marginBottom: spacing[4],
    borderLeftWidth: 3, borderLeftColor: colors.danger,
  },
  link: { minHeight: layout.minimumTouchTarget, minWidth: layout.minimumTouchTarget, justifyContent: 'center', alignSelf: 'center' },
  linkLabel: { ...typography.label, fontSize: 14, color: colors.forest, textAlign: 'center' },
});
