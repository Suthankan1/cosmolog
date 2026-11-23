import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, layout, radii, typography, spacing } from '../../theme/tokens';
import { Icon } from './Icon';

export interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoComplete?: TextInputProps['autoComplete'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  onInputBlur?: () => void;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  autoComplete,
  onSubmitEditing,
  onInputBlur,
  error,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  editable,
  maxLength,
  style,
  testID,
  accessibilityLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={isPassword && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          onSubmitEditing={onSubmitEditing}
          keyboardType={keyboardType}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); onInputBlur?.(); }}
          style={styles.textInput}
          accessibilityLabel={accessibilityLabel || label}
          testID={testID}
        />
        {isPassword && (
          <Pressable
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
      {Boolean(error) && <Text accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    width: '100%',
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.inputHeight,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
  },
  inputFocused: {
    borderColor: colors.forest,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    minHeight: layout.inputHeight,
    paddingVertical: spacing[2],
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.ink,
  },
  eyeButton: {
    padding: spacing[1],
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: layout.minimumTouchTarget,
    minHeight: layout.minimumTouchTarget,
  },
  errorText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 11,
    color: colors.danger,
    marginTop: spacing[1],
  },
});

export default Input;
