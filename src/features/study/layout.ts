import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

export const studyStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[3] },
  heading: { ...typography.h1, color: colors.forest },
  section: { ...typography.h2, color: colors.ink },
  body: { ...typography.body, color: colors.ink, fontSize: 16, lineHeight: 25 },
  note: { ...typography.bodySmall, color: colors.muted },
  row: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[2],
  },
});
