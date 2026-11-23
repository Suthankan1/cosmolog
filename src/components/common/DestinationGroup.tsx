import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radii, spacing, typography } from '../../theme/tokens';
import { Icon, type FeatherIconName } from './Icon';

export function DestinationGroup({ title, icon, children }: { title: string; icon: FeatherIconName; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.group}>
      <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded }}
        onPress={() => setExpanded(value => !value)} style={styles.row} android_ripple={{ color: colors.sageLight }}>
        <Icon name={icon} color={colors.forest} />
        <Text style={styles.title}>{title}</Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.forest} />
      </Pressable>
      {expanded && <View style={styles.links}>{children}</View>}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden' },
  row: { minHeight: layout.minimumTouchTarget, paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  title: { ...typography.label, color: colors.forest, flex: 1 },
  links: { marginHorizontal: spacing[2], borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
