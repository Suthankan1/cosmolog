import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

export const studyStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[3] },
  heading: { ...typography.display, color: colors.ink, borderTopWidth: 3, borderColor: colors.terracotta, paddingTop: spacing[3] },
  kicker: { ...typography.label, color: colors.forest, letterSpacing: 1, textTransform: 'uppercase' },
  entryTitle: { ...typography.h2, color: colors.ink },
  pack: { gap: spacing[2], padding: spacing[4], backgroundColor: colors.surface, borderTopWidth: 2, borderColor: colors.forest },
  section: { ...typography.h2, color: colors.ink },
  body: { ...typography.body, color: colors.ink, fontSize: 16, lineHeight: 25 },
  note: { ...typography.bodySmall, color: colors.muted },
  row: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing[1], paddingVertical: spacing[3],
  },
});
