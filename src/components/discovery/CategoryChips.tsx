import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../../theme/tokens';
import { FilterChip } from '../common/FilterChip';
import { DiscoverySource } from '../../navigation/types';

export interface CategoryChipsProps {
  selectedCategory: 'all' | DiscoverySource;
  onSelectCategory: (category: 'all' | DiscoverySource) => void;
}

const CATEGORIES: { label: string; value: 'all' | DiscoverySource }[] = [
  { label: 'All sources', value: 'all' },
  { label: 'Daily Plates', value: 'nasa-apod' },
  { label: 'Dispatches', value: 'spaceflight-news' },
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
      {CATEGORIES.map(cat => (
        <FilterChip key={cat.value} title={cat.label} selected={selectedCategory === cat.value}
          onPress={() => onSelectCategory(cat.value)} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: spacing[2],
    gap: spacing[2],
  },

});

export default CategoryChips;
