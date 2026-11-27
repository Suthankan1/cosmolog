import { useEffect, useState } from 'react';
import { BottomTabBar, Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Keyboard, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingSurface } from '../../src/components/common/FloatingSurface';
import { Icon, type FeatherIconName } from '../../src/components/common/Icon';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/ThemeContext';

const destinations = [
  { name: 'discover', title: 'Discover', icon: 'compass' },
  { name: 'favourites', title: 'Favourites', icon: 'bookmark' },
  { name: 'profile', title: 'Profile', icon: 'user' },
] as const satisfies readonly { name: string; title: string; icon: FeatherIconName }[];

function FloatingTabBar(props: BottomTabBarProps) {
  const [editing, setEditing] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setEditing(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setEditing(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return editing ? null : <BottomTabBar {...props} />;
}

export default function TabLayout() {
  const { bottom, left, right } = useSafeAreaInsets();
  const { fontScale, width } = useWindowDimensions();
  const { isNight, colors: themeColors } = useTheme();
  const [labelWidth, setLabelWidth] = useState(0);
  const usable = width - left - right;
  const dockWidth = Math.min(usable - spacing[2], Math.max(layout.dockWidth, Math.ceil(3 * (labelWidth + 14) + 12)));
  const side = (usable - dockWidth) / 2;
  return (
    <View style={{ flex: 1 }}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', opacity: 0, alignItems: 'flex-start' }}>
        <Text style={styles.label} onLayout={event => setLabelWidth(event.nativeEvent.layout.width)}>Favourites</Text>
      </View>
    <Tabs tabBar={props => <FloatingTabBar {...props} />} screenOptions={{
      headerShown: false,
      tabBarLabelPosition: 'below-icon',
      tabBarActiveTintColor: isNight ? themeColors.forest : colors.forest,
      tabBarInactiveTintColor: isNight ? themeColors.textSecondary : colors.ink,
      tabBarActiveBackgroundColor: isNight ? themeColors.sageLight : colors.sageLight,
      tabBarBackground: () => <FloatingSurface />,
      tabBarStyle: [styles.bar, {
        height: 'auto', minHeight: 40 + Math.ceil(17 * fontScale), bottom: bottom + spacing[2], start: left + side, end: right + side,
      }],
      tabBarItemStyle: styles.item,
    }}>
      {destinations.map(({ name, title, icon }) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarAccessibilityLabel: title,
          tabBarIcon: ({ color }) => <Icon name={icon} size={24} color={color} />,
          tabBarLabel: ({ color }) => <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color }]}>{title}</Text>,
        }} />
      ))}
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', paddingHorizontal: 6, paddingVertical: 3, paddingBottom: 3,
    borderTopWidth: 0, borderRadius: radii.pill, backgroundColor: 'transparent',
    boxShadow: '0px 3px 12px rgba(24, 66, 53, 0.16)',
  },
  item: { minHeight: layout.minimumTouchTarget, borderRadius: radii.pill, overflow: 'hidden', paddingVertical: 0 },
  label: { ...typography.label, textAlign: 'center', paddingHorizontal: 2 },
});
