import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingSurface } from '../../src/components/common/FloatingSurface';
import { Icon, type FeatherIconName } from '../../src/components/common/Icon';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';

const destinations = [
  { name: 'discover', title: 'Discover', icon: 'compass' },
  { name: 'favourites', title: 'Favourites', icon: 'bookmark' },
  { name: 'profile', title: 'Profile', icon: 'user' },
] as const satisfies readonly { name: string; title: string; icon: FeatherIconName }[];

export default function TabLayout() {
  const { bottom, left, right } = useSafeAreaInsets();
  const { fontScale, width } = useWindowDimensions();
  const side = width <= 360 || fontScale > 1.3 ? spacing[1] : layout.floatingInset;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarLabelPosition: 'below-icon',
      tabBarActiveTintColor: colors.forest,
      tabBarInactiveTintColor: colors.ink,
      tabBarActiveBackgroundColor: colors.sageLight,
      tabBarBackground: () => <FloatingSurface />,
      tabBarStyle: [styles.bar, {
        height: 'auto', minHeight: 52 + Math.ceil(17 * fontScale), bottom: bottom + spacing[2], start: left + side, end: right + side,
      }],
      tabBarItemStyle: styles.item,
    }}>
      {destinations.map(({ name, title, icon }) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarIcon: ({ color }) => <Icon name={icon} size={24} color={color} />,
          tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]}>{title}</Text>,
        }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', paddingHorizontal: 6, paddingVertical: 5, paddingBottom: 5,
    borderTopWidth: 0, borderRadius: radii.pill, backgroundColor: 'transparent',
    boxShadow: '0px 3px 12px rgba(24, 66, 53, 0.16)',
  },
  item: { minHeight: layout.minimumTouchTarget, borderRadius: radii.pill, overflow: 'hidden', paddingVertical: 3 },
  label: { ...typography.label, textAlign: 'center', paddingHorizontal: 2 },
});
