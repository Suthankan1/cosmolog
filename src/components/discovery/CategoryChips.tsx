import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { DiscoverySource } from '../../navigation/types';
import { colors, layout, spacing, typography } from '../../theme/tokens';

export interface CategoryChipsProps {
  selectedCategory: 'all' | DiscoverySource;
  onSelectCategory: (category: 'all' | DiscoverySource) => void;
}

const editions = [
  { label: 'All sources', value: 'all' },
  { label: 'Daily Plates', value: 'nasa-apod' },
  { label: 'Dispatches', value: 'spaceflight-news' },
] as const;

export function CategoryChips({ selectedCategory, onSelectCategory }: CategoryChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {editions.map(({ label, value }) => {
        const selected = value === selectedCategory;
        return (
          <Pressable key={value} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }}
            android_ripple={{ color: colors.sageLight }} style={[styles.tab, selected && styles.selected]}
            onPress={() => onSelectCategory(value)}>
            <Text style={[styles.label, selected && styles.activeText]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 1, gap: spacing[2], borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  tab: { minHeight: layout.minimumTouchTarget, flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing[2], borderBottomWidth: 3, borderColor: 'transparent' },
  selected: { borderColor: colors.terracotta },
  label: { ...typography.label, color: colors.muted },
  activeText: { color: colors.forest },
});
