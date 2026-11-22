import React, { useEffect } from 'react';
import {
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
import { LoginFormData, loginSchema } from '../../src/services/auth/authSchemas';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { clearAuthError, loginThunk } from '../../src/store/slices/authSlice';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { Icon } from '../../src/components/common/Icon';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const onSubmit = (data: LoginFormData) => {
    dispatch(clearAuthError());
    dispatch(loginThunk(data));
  };

  const autofillDemo = () => {
    setValue('username', 'emilys');
    setValue('password', 'emilyspass');
    dispatch(clearAuthError());
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
          <Text style={styles.brandTagline}>A field journal for the universe</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardHeader}>Sign in to your field archive</Text>

          {Boolean(error) && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Icon name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Username"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. emilys"
                error={errors.username?.message}
                autoCapitalize="none"
                testID="login-username-input"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                placeholder="Enter password"
                error={errors.password?.message}
                secureTextEntry
                testID="login-password-input"
              />
            )}
          />

          <Pressable
            onPress={autofillDemo}
            style={styles.demoHelperPill}
            accessibilityRole="button"
            accessibilityLabel="Autofill demo credentials"
          >
            <Icon name="key" size={14} color={colors.brass} style={styles.demoIcon} />
            <Text style={styles.demoHelperText}>Tap to autofill demo account (emilys)</Text>
          </Pressable>

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            variant="primary"
            style={styles.submitButton}
            testID="login-submit-button"
          />

          <View style={styles.switchAuthRow}>
            <Text style={styles.switchPrompt}>New to the observatory?</Text>
            <Pressable
              onPress={() => {
                dispatch(clearAuthError());
                router.push('/(auth)/register');
              }}
              style={styles.switchButton}
              accessibilityRole="link"
              accessibilityLabel="Navigate to Create Account"
            >
              <Text style={styles.switchActionText}>Create Account</Text>
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
    marginBottom: spacing[5],
    textAlign: 'center',
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
  demoHelperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EEDB',
    borderRadius: radii.pill,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.brass,
  },
  demoIcon: {
    marginRight: 6,
  },
  demoHelperText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.ink,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: spacing[1],
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
