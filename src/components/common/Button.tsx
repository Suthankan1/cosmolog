import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, layout, radii, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { FeatherIconName, Icon } from './Icon';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'secondary' | 'destination' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: FeatherIconName;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const { isNight, colors: themeColors } = useTheme();
  const isOutline = variant === 'outline' || variant === 'secondary';
  const destination = variant === 'destination';
  const isDanger = variant === 'danger';

  const containerStyles = [
    styles.buttonBase,
    variant === 'primary' && styles.primaryButton,
    variant === 'primary' && isNight && { backgroundColor: themeColors.forest },
    isOutline && styles.secondaryButton,
    isOutline && isNight && { backgroundColor: themeColors.sageLight },
    destination && styles.destination,
    destination && isNight && { backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1 },
    isDanger && styles.dangerButton,
    isDanger && isNight && { borderColor: themeColors.danger },
    disabled && styles.disabledButton,
    disabled && isNight && { backgroundColor: themeColors.border },
    style,
  ];

  const labelStyles = [
    styles.buttonText,
    variant === 'primary' && styles.primaryText,
    variant === 'primary' && isNight && { color: themeColors.ivory },
    (isOutline || destination) && styles.outlineText,
    (isOutline || destination) && isNight && { color: destination ? themeColors.ink : themeColors.forest },
    isDanger && styles.dangerText,
    isDanger && isNight && { color: themeColors.danger },
    disabled && styles.disabledText,
    disabled && isNight && { color: themeColors.muted },
    textStyle,
  ];

  const iconColor = isNight
    ? (variant === 'primary' ? themeColors.ivory : isDanger ? themeColors.danger : themeColors.forest)
    : (variant === 'primary' ? colors.white : isDanger ? colors.danger : colors.forest);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: variant === 'primary' ? '#FFFFFF26' : '#18423516' }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        containerStyles,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
    >
      {loading && (
        <ActivityIndicator
          style={styles.spinner}
          size="small"
          color={variant === 'primary' ? colors.white : colors.forest}
        />
      )}
        <View style={[styles.contentRow, destination && styles.destinationContent, loading && styles.hidden]}>
          {icon && (
            <Icon
              name={icon}
              size={20}
              color={iconColor}
              style={styles.iconStyle}
            />
          )}
          <Text style={[labelStyles, destination && styles.destinationText]}>{title}</Text>
          {destination && <Icon name="chevron-right" size={18} color={colors.muted} />}
        </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    minHeight: layout.primaryButtonHeight,
    minWidth: layout.minimumTouchTarget,
    borderRadius: radii.pill,
    overflow: 'hidden',
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: colors.forest,
  },
  secondaryButton: {
    backgroundColor: colors.sageLight,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
  destination: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 14, minHeight: layout.minimumTouchTarget },
  destinationContent: { flex: 1 },
  destinationText: { flex: 1, textAlign: 'left' },
  spinner: { position: 'absolute' },
  hidden: { opacity: 0 },
  pressed: {
    opacity: 0.82,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStyle: {
    marginRight: 8,
  },
  buttonText: {
    flexShrink: 1,
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.forest,
  },
  dangerText: {
    color: colors.danger,
  },
  disabledText: {
    color: colors.muted,
  },
});

export default Button;
