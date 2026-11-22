import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, layout, radii, spacing, typography } from '../../theme/tokens';
import { DiscoverySource } from '../../navigation/types';

export interface CategoryChipsProps {
  selectedCategory: 'all' | DiscoverySource;
  onSelectCategory: (category: 'all' | DiscoverySource) => void;
}

const CATEGORIES: { label: string; value: 'all' | DiscoverySource }[] = [
  { label: 'All Dispatches', value: 'all' },
  { label: 'The Daily Plate (NASA)', value: 'nasa-apod' },
  { label: 'Spaceflight Missions', value: 'spaceflight-news' },
];

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.value;
        return (
          <Pressable
            key={cat.value}
            onPress={() => onSelectCategory(cat.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filter by ${cat.label}`}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  chip: {
    minHeight: 36,
    minWidth: layout.minimumTouchTarget,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  chipText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.ivory,
  },
});

export default CategoryChips;
