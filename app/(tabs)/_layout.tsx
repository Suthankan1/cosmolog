import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { Icon } from '../../src/components/common/Icon';
import { colors, layout, typography } from '../../src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Icon name="compass" color={color} size={size} accessibilityLabel="Discover tab" />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'The Shelf',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bookmark" color={color} size={size} accessibilityLabel="Favourites tab" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Field Log',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" color={color} size={size} accessibilityLabel="Profile tab" />
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
    height: Platform.OS === 'ios' ? layout.bottomNavHeight + 10 : layout.bottomNavHeight,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    elevation: 4,
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
