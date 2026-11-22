import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing } from '../../../src/theme/tokens';

export interface DetailsRouteParams {
  source: 'nasa-apod' | 'spaceflight-news';
  id: string;
}

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ source?: string; id?: string }>();
  const source = params.source || 'unknown';
  const id = params.id || 'unknown';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discovery Details</Text>
      <Text style={styles.meta}>Source: {source} | Item ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    color: colors.forest,
    marginBottom: spacing[2],
  },
  meta: {
    fontFamily: typography.meta.fontFamily,
    fontSize: typography.meta.fontSize,
    color: colors.muted,
  },
});
