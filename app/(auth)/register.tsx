import React, { useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterFormData, registerSchema } from '../../src/services/auth/authSchemas';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { clearAuthError, registerThunk, resetRegistrationStatus } from '../../src/store/slices/authSlice';
import { radii } from '../../src/theme/tokens';
import { Button } from '../../src/components/common/Button';
import { Input, type InputProps } from '../../src/components/common/Input';
import { AuthLink, AuthSheet } from '../../src/features/auth/AuthSheet';

const fields: { name: keyof RegisterFormData; input: Pick<InputProps, 'label' | 'autoComplete' | 'keyboardType' | 'autoCapitalize' | 'secureTextEntry'> }[] = [
  { name: 'firstName', input: { label: 'First name', autoCapitalize: 'words', autoComplete: 'given-name' } },
  { name: 'username', input: { label: 'Username', autoComplete: 'username' } },
  { name: 'email', input: { label: 'Email', keyboardType: 'email-address', autoComplete: 'email' } },
  { name: 'password', input: { label: 'Password', secureTextEntry: true, autoComplete: 'new-password' } },
  { name: 'confirmPassword', input: { label: 'Confirm password', secureTextEntry: true, autoComplete: 'new-password' } },
];

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, registrationSuccess } = useAppSelector(state => state.auth);
  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', username: '', email: '', password: '', confirmPassword: '' },
  });
  const submit = () => { void handleSubmit(data => dispatch(registerThunk(data)))(); };

  useEffect(() => {
    if (!registrationSuccess) return;
    Alert.alert('Registration complete', 'This demo registration is a simulation. Use the demo account on the sign-in screen.', [
      { text: 'Go to sign in', onPress: () => {
        dispatch(resetRegistrationStatus());
        if (router.canGoBack()) router.back();
        else router.replace('/(auth)/login');
      } },
    ]);
  }, [registrationSuccess, dispatch, router]);

  return (
    <AuthSheet register title="Create an account" subtitle="Registration is simulated through DummyJSON. Use demo credentials to sign in afterwards." error={error}>
      {fields.map(({ name, input }) => (
        <Controller key={name} control={control} name={name} render={({ field, fieldState }) => (
          <Input {...input} value={field.value} onChangeText={field.onChange} onInputBlur={field.onBlur}
            error={fieldState.error?.message} testID={'register-' + name + '-input'}
            onSubmitEditing={name === 'confirmPassword' ? submit : undefined} />
        )} />
      ))}
      <Button title="Create demo account" loading={isLoading} onPress={submit}
        testID="register-submit-button" style={styles.primary} />
      <AuthLink title="Back to sign in" disabled={isLoading} onPress={() => {
        dispatch(clearAuthError());
        if (router.canGoBack()) router.back();
        else router.replace('/(auth)/login');
      }} />
    </AuthSheet>
  );
}

const styles = StyleSheet.create({
  primary: { borderRadius: radii.pill },
});
