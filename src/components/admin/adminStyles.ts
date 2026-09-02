import { StyleSheet } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

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

export const adminHero = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 2,
  },
  heading: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  subheading: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
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
