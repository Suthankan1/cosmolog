import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormData, loginSchema } from '../../src/services/auth/authSchemas';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { subscribeToNetworkState, type Connection } from '../../src/services/network/networkObserver';
import { clearAuthError, loginThunk } from '../../src/store/slices/authSlice';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { AuthLink, AuthSheet } from '../../src/features/auth/AuthSheet';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [connection, setConnection] = useState<Connection>('unknown');
  useEffect(() => subscribeToNetworkState(setConnection), []);
  const { control, handleSubmit, setValue, clearErrors } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema), defaultValues: { username: '', password: '' },
  });
  const submit = () => { void handleSubmit(data => dispatch(loginThunk(data)))(); };

  return (
    <AuthSheet title="Welcome back." subtitle="Sign in to open your space and science archive." error={error}>
      {connection === 'offline' && <Text accessibilityLiveRegion="polite" style={styles.offline}>Connect to sign in.</Text>}
      <Controller
        control={control}
        name="username"
        render={({ field, fieldState }) => (
          <Input label="Username" value={field.value} onChangeText={field.onChange} onInputBlur={field.onBlur}
            placeholder="Enter your username" autoComplete="username" error={fieldState.error?.message} testID="login-username-input" />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <Input label="Password" value={field.value} onChangeText={field.onChange} onInputBlur={field.onBlur}
            placeholder="Enter your password" autoComplete="current-password" error={fieldState.error?.message}
            secureTextEntry onSubmitEditing={submit} testID="login-password-input" />
        )}
      />
      <Button title="Sign in" icon="arrow-right" loading={isLoading} onPress={submit}
        style={styles.primary} testID="login-submit-button" />
      <View style={styles.links}>
        <AuthLink title="Use demo account" disabled={isLoading} onPress={() => {
          setValue('username', 'emilys');
          setValue('password', 'emilyspass');
          clearErrors();
          dispatch(clearAuthError());
        }} />
        <AuthLink title="Create an account" disabled={isLoading} onPress={() => {
          dispatch(clearAuthError());
          router.push('/(auth)/register');
        }} />
      </View>
      <Text style={styles.footnote}>Your saved library stays on this device.</Text>
    </AuthSheet>
  );
}

const styles = StyleSheet.create({
  primary: { borderRadius: radii.pill },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: spacing[3], marginTop: spacing[1] },
  offline: { ...typography.body, color: colors.forest, marginBottom: spacing[3] },
  footnote: {
    ...typography.bodySmall, color: colors.muted, paddingTop: spacing[3], borderTopWidth: 1,
    borderTopColor: colors.border, marginTop: spacing[1],
  },
});
