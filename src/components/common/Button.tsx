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
import { FeatherIconName, Icon } from './Icon';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
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
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  const containerStyles = [
    styles.buttonBase,
    variant === 'primary' && styles.primaryButton,
    isOutline && styles.outlineButton,
    isDanger && styles.dangerButton,
    disabled && styles.disabledButton,
    style,
  ];

  const labelStyles = [
    styles.buttonText,
    variant === 'primary' && styles.primaryText,
    isOutline && styles.outlineText,
    isDanger && styles.dangerText,
    disabled && styles.disabledText,
    textStyle,
  ];

  const iconColor = variant === 'primary' ? colors.white : isDanger ? colors.danger : colors.forest;

  return (
    <Pressable
      onPress={onPress}
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
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.forest}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <Icon
              name={icon}
              size={18}
              color={iconColor}
              style={styles.iconStyle}
            />
          )}
          <Text style={labelStyles}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    minHeight: layout.primaryButtonHeight,
    minWidth: layout.minimumTouchTarget,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: colors.forest,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.forest,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
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
