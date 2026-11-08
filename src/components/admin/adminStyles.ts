import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const adminErrorBanner = StyleSheet.create({
  box: {
    backgroundColor: colors.errorTint,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    fontSize: 14,
    color: colors.danger,
  },
});

export const adminSection = StyleSheet.create({
  title: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
});

export const adminList = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.selected,
    borderColor: `${colors.primary}44`,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primaryDark,
  },
  addBtn: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  addBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  filterBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
});
