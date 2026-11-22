import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { FeatherIconName, Icon } from './Icon';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: FeatherIconName;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  loading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={36} color={colors.forest} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {Boolean(actionTitle && onAction) && (
        <Button
          title={actionTitle!}
          onPress={onAction!}
          loading={loading}
          variant="outline"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    color: colors.forest,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing[6],
  },
  actionButton: {
    minWidth: 160,
  },
});

export default EmptyState;
