import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HierarchyBreadcrumbCard } from './HierarchyBreadcrumbCard';
import type { OccupancyHierarchyContext } from './HierarchyBreadcrumbCard';
import { colors, radius, spacing, typography } from '../../theme';

type OccupancyWizardStepHeaderProps = {
  stepProgress?: { current: number; total: number };
  stepTitle: string;
  stepHint?: string | null;
  Icon?: LucideIcon;
  hierarchyContext: OccupancyHierarchyContext;
  bulkProgress?: string | null;
  bulkHint?: string | null;
};

export function OccupancyWizardStepHeader({
  stepProgress,
  stepTitle,
  stepHint,
  Icon,
  hierarchyContext,
  bulkProgress,
  bulkHint,
}: OccupancyWizardStepHeaderProps) {
  const { t } = useTranslation();
  const progressRatio =
    stepProgress && stepProgress.total > 0
      ? Math.min(1, Math.max(0, stepProgress.current / stepProgress.total))
      : 0;

  return (
    <View style={styles.wrap}>
      {stepProgress ? (
        <View style={styles.progressBlock}>
          <Text style={styles.stepProgress}>
            {t('occupancyWizard.stepProgress', {
              current: stepProgress.current,
              total: stepProgress.total,
            })}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressRatio * 100}%` }]}
            />
          </View>
        </View>
      ) : null}

      <HierarchyBreadcrumbCard context={hierarchyContext} />

      <View style={styles.titleRow}>
        {Icon ? (
          <View style={styles.iconWrap} accessibilityElementsHidden>
            <Icon size={18} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
        ) : null}
        <View style={styles.titleBlock}>
          <Text style={styles.stepTitle}>{stepTitle}</Text>
          {stepHint ? <Text style={styles.stepHint}>{stepHint}</Text> : null}
        </View>
      </View>
      {bulkProgress ? (
        <Text style={styles.bulkProgress}>
          {t('occupancy.hierarchy.bulkProgress', { progress: bulkProgress })}
        </Text>
      ) : null}
      {bulkHint ? <Text style={styles.bulkHint}>{bulkHint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  progressBlock: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  stepProgress: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: colors.muted,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  stepHint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  bulkProgress: {
    ...typography.caption,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  bulkHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
