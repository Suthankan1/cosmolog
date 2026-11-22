import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/common/Icon';
import { colors, layout, typography } from '../../src/theme/tokens';

export default function TabLayout() {
  const { bottom } = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: [styles.tabBar, { height: Math.max(60, 48 + 14 * fontScale) + bottom }],
        tabBarAllowFontScaling: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Favourites',
          tabBarIcon: ({ color, size }) => (
            <Icon name="book-open" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 4,
    elevation: 0,
  },
  tabBarItem: {
    minHeight: layout.minimumTouchTarget,
  },
  tabBarLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
});
