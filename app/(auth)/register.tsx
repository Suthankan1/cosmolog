import React, { useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterFormData, registerSchema } from '../../src/services/auth/authSchemas';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { clearAuthError, registerThunk, resetRegistrationStatus } from '../../src/store/slices/authSlice';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { Icon } from '../../src/components/common/Icon';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, registrationSuccess } = useAppSelector((state) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (registrationSuccess) {
      Alert.alert(
        'Account Registered',
        'Your simulated account has been created via DummyJSON. Please sign in with your demo credentials (e.g. emilys / emilyspass).',
        [
          {
            text: 'Go to Sign In',
            onPress: () => {
              dispatch(resetRegistrationStatus());
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    }
  }, [registrationSuccess, dispatch, router]);

  const onSubmit = (data: RegisterFormData) => {
    dispatch(clearAuthError());
    dispatch(registerThunk(data));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/brand/cosmolog-mark.png')}
            style={styles.logoMark}
            resizeMode="contain"
            accessibilityLabel="COSMOLOG Celestial Crescent Mark"
          />
          <Text style={styles.brandTitle}>COSMOLOG</Text>
          <Text style={styles.brandTagline}>Open a new celestial field journal</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardHeader}>Create Account</Text>

          <View style={styles.disclosureBox}>
            <Icon name="info" size={16} color={colors.forest} style={styles.disclosureIcon} />
            <Text style={styles.disclosureText}>
              Academic Notice: User registration is simulated via DummyJSON POST /users/add per assignment requirements.
            </Text>
          </View>

          {Boolean(error) && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Icon name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="First Name"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Arthur"
                error={errors.firstName?.message}
                autoCapitalize="words"
                testID="register-firstname-input"
              />
            )}
          />

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Username"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. stargazer"
                error={errors.username?.message}
                autoCapitalize="none"
                testID="register-username-input"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. arthur@cosmolog.org"
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="register-email-input"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password (min 6 characters)"
                value={value}
                onChangeText={onChange}
                placeholder="Create a password"
                error={errors.password?.message}
                secureTextEntry
                testID="register-password-input"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm Password"
                value={value}
                onChangeText={onChange}
                placeholder="Confirm password"
                error={errors.confirmPassword?.message}
                secureTextEntry
                testID="register-confirm-password-input"
              />
            )}
          />

          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            variant="primary"
            style={styles.submitButton}
            testID="register-submit-button"
          />

          <View style={styles.switchAuthRow}>
            <Text style={styles.switchPrompt}>Already registered?</Text>
            <Pressable
              onPress={() => {
                dispatch(clearAuthError());
                router.replace('/(auth)/login');
              }}
              style={styles.switchButton}
              accessibilityRole="link"
              accessibilityLabel="Navigate to Sign In"
            >
              <Text style={styles.switchActionText}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.horizontalInset,
    paddingVertical: spacing[8],
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logoMark: {
    width: 64,
    height: 64,
    marginBottom: spacing[3],
  },
  brandTitle: {
    fontFamily: typography.display.fontFamily,
    fontSize: typography.display.fontSize,
    lineHeight: typography.display.lineHeight,
    color: colors.forest,
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandTagline: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    fontFamily: typography.h2.fontFamily,
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    color: colors.ink,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  disclosureBox: {
    flexDirection: 'row',
    backgroundColor: '#EDF3EC',
    borderRadius: radii.sm,
    padding: spacing[3],
    marginBottom: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.forest,
    alignItems: 'center',
  },
  disclosureIcon: {
    marginRight: spacing[2],
  },
  disclosureText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 11,
    lineHeight: 16,
    color: colors.forestDark,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBEBE8',
    borderRadius: radii.sm,
    padding: spacing[3],
    marginBottom: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorBannerText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
    marginLeft: spacing[2],
    flex: 1,
  },
  submitButton: {
    marginTop: spacing[2],
  },
  switchAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[5],
  },
  switchPrompt: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: typography.bodySmall.fontSize,
    color: colors.muted,
  },
  switchButton: {
    marginLeft: spacing[2],
    minHeight: layout.minimumTouchTarget,
    justifyContent: 'center',
  },
  switchActionText: {
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
    color: colors.terracotta,
    fontWeight: '600',
  },
});
