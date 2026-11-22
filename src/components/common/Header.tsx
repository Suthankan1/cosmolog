import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing, typography } from '../../theme/tokens';
import { Icon } from './Icon';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  style,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/discover');
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }, style]}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="arrow-left" size={22} color={colors.forest} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {Boolean(subtitle) && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>{rightElement || <View style={styles.placeholder} />}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: layout.horizontalInset,
    paddingBottom: spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minimumTouchTarget,
  },
  backButton: {
    width: layout.minimumTouchTarget,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    lineHeight: 24,
    color: colors.forest,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  rightContainer: {
    minWidth: layout.minimumTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: layout.minimumTouchTarget,
  },
});

export default Header;
