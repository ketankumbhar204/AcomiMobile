import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/Skeleton';
import { colors, radius, shadows, spacing } from '../../theme';

type DashboardOwnerLoadingSkeletonProps = {
  /** Show property-ops skeleton row (non-mess lodging). */
  showPropertyOps?: boolean;
  /** Show meal-ops skeleton block. */
  showMealOps?: boolean;
};

/**
 * Layout-stable owner dashboard placeholder. Matches Hero / setup / ops / quick-actions
 * heights so content does not jump when real data arrives.
 */
export function DashboardOwnerLoadingSkeleton({
  showPropertyOps = true,
  showMealOps = true,
}: DashboardOwnerLoadingSkeletonProps) {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading dashboard" accessibilityRole="progressbar">
      <View style={styles.hero}>
        <View style={styles.heroCol}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width="55%" height={12} style={styles.gapSm} />
          <Skeleton width="80%" height={20} style={styles.gapSm} />
          <Skeleton width="70%" height={12} style={styles.gapSm} />
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroCol}>
          <Skeleton width="70%" height={12} />
          <View style={styles.healthRow}>
            <Skeleton width={46} height={46} borderRadius={23} />
            <View style={styles.healthCopy}>
              <Skeleton width="75%" height={14} />
              <Skeleton width="50%" height={12} style={styles.gapSm} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.setupCard}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="100%" height={8} borderRadius={4} style={styles.gapMd} />
        <View style={styles.stepperRow}>
          {[0, 1, 2, 3].map(key => (
            <View key={key} style={styles.stepCol}>
              <Skeleton width={28} height={28} borderRadius={14} />
              <Skeleton width="90%" height={10} style={styles.gapSm} />
            </View>
          ))}
        </View>
        <View style={styles.nextBlock}>
          <Skeleton width="30%" height={12} />
          <Skeleton width="75%" height={16} style={styles.gapSm} />
          <Skeleton width="95%" height={12} style={styles.gapSm} />
          <View style={styles.nextActions}>
            <Skeleton width="30%" height={44} borderRadius={radius.button} />
            <Skeleton width="62%" height={44} borderRadius={radius.button} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Skeleton width="45%" height={16} />
        <Skeleton width="25%" height={12} style={styles.gapSm} />
        <View style={styles.metricRow}>
          {[0, 1, 2, 3].map(key => (
            <View key={key} style={styles.metricCard}>
              <Skeleton width={22} height={22} borderRadius={6} />
              <Skeleton width="70%" height={18} style={styles.gapSm} />
              <Skeleton width="55%" height={11} style={styles.gapSm} />
            </View>
          ))}
        </View>
      </View>

      {showPropertyOps ? (
        <View style={styles.section}>
          <Skeleton width="50%" height={16} />
          <View style={styles.metricRow}>
            {[0, 1, 2].map(key => (
              <View key={key} style={styles.metricCard}>
                <Skeleton width={22} height={22} borderRadius={6} />
                <Skeleton width="50%" height={22} style={styles.gapSm} />
                <Skeleton width="80%" height={11} style={styles.gapSm} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {showMealOps ? (
        <View style={styles.section}>
          <Skeleton width="45%" height={16} />
          <Skeleton width="100%" height={40} borderRadius={radius.button} style={styles.gapMd} />
          <View style={styles.metricRow}>
            {[0, 1, 2].map(key => (
              <View key={key} style={styles.mealCard}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <Skeleton width="70%" height={12} style={styles.gapSm} />
                <Skeleton width="80%" height={20} borderRadius={radius.full} style={styles.gapSm} />
                <Skeleton width="60%" height={11} style={styles.gapSm} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Skeleton width="35%" height={16} />
        <View style={styles.quickStack}>
          {[0, 1, 2, 3].map(key => (
            <View key={key} style={styles.quickRow}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <View style={styles.quickCopy}>
                <Skeleton width="55%" height={14} />
                <Skeleton width="75%" height={11} style={styles.gapSm} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 112,
    ...shadows.sm,
  },
  heroCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  healthCopy: {
    flex: 1,
    minWidth: 0,
  },
  setupCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
  },
  nextBlock: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  nextActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    minHeight: 72,
  },
  mealCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    minHeight: 110,
  },
  quickStack: {
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 64,
  },
  quickCopy: {
    flex: 1,
    minWidth: 0,
  },
  gapSm: {
    marginTop: spacing.xs,
  },
  gapMd: {
    marginTop: spacing.md,
  },
});
