import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, layout, radii, spacing, typography } from '../../theme/tokens';
import { Icon } from './Icon';

export function FilterChip({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable android_ripple={{ color: colors.sageLight }} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected }} style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      {selected && <Icon name="check" size={14} color={colors.forest} />}
      <Text style={styles.filterLabel}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    gap: spacing[1], minHeight: layout.minimumTouchTarget, paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderRadius: radii.pill, borderColor: colors.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
  },
  chipSelected: { backgroundColor: colors.sageLight, borderColor: colors.forest },
  filterLabel: { ...typography.label, color: colors.forest },
});
