import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HierarchyBreadcrumbCard } from './HierarchyBreadcrumbCard';
import type { OccupancyHierarchyContext } from './HierarchyBreadcrumbCard';
import { colors, spacing, typography } from '../../theme';

type OccupancyWizardStepHeaderProps = {
  stepProgress?: { current: number; total: number };
  stepTitle: string;
  hierarchyContext: OccupancyHierarchyContext;
  bulkProgress?: string | null;
  bulkHint?: string | null;
};

export function OccupancyWizardStepHeader({
  stepProgress,
  stepTitle,
  hierarchyContext,
  bulkProgress,
  bulkHint,
}: OccupancyWizardStepHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      {stepProgress ? (
        <Text style={styles.stepProgress}>
          {t('occupancyWizard.stepProgress', {
            current: stepProgress.current,
            total: stepProgress.total,
          })}
        </Text>
      ) : null}
      <Text style={styles.stepTitle}>{stepTitle}</Text>
      {bulkProgress ? (
        <Text style={styles.bulkProgress}>
          {t('occupancy.hierarchy.bulkProgress', { progress: bulkProgress })}
        </Text>
      ) : null}
      {bulkHint ? <Text style={styles.bulkHint}>{bulkHint}</Text> : null}
      <HierarchyBreadcrumbCard context={hierarchyContext} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  stepProgress: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  stepTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
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
