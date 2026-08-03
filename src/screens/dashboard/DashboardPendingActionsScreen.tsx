import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock3, TriangleAlert } from 'lucide-react-native';
import type { UUID } from '../../api/types';
import { PendingActionsList } from '../../components/dashboard/PendingActionGroupCard';
import { DashboardStatCard } from '../../components/dashboard/shared/DashboardStatCard';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { EmptyState, Screen, Skeleton, SkeletonCard } from '../../components/ui';
import { usePendingActions } from '../../hooks/usePendingActions';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { canManageNotifications } from '../../utils/spaceOperator';

type Route = NativeStackScreenProps<MainStackParamList, 'DashboardPendingActions'>['route'];

type DashboardPendingActionsScreenProps = {
  spaceId?: UUID;
};

export function DashboardPendingActionsScreen({
  spaceId: spaceIdProp,
}: DashboardPendingActionsScreenProps) {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const spaceId = spaceIdProp ?? route.params.spaceId;
  const permissions = useSpacePermissions(spaceId);
  const showOwnerDashboard = canManageNotifications(permissions);

  // Always load from pending-actions API (syncs payments + meal ops) so the list
  // matches the dashboard badge. Owners must not use the tenant filter.
  const pending = usePendingActions(spaceId, true, showOwnerDashboard);
  const pendingActions = pending.summary;

  const showInitialLoader = pending.loading && pending.summary == null;

  const empty = useMemo(() => {
    if (showInitialLoader) {
      return false;
    }
    return (pendingActions?.totalCount ?? 0) === 0;
  }, [pendingActions?.totalCount, showInitialLoader]);

  const criticalCount = useMemo(() => {
    const groups = pendingActions?.groups ?? [];
    return groups
      .filter(g => g.priority === 'CRITICAL' || g.priority === 'HIGH')
      .reduce((sum, g) => sum + g.count, 0);
  }, [pendingActions?.groups]);

  const todayCount = useMemo(() => {
    const groups = pendingActions?.groups ?? [];
    return groups
      .filter(
        g =>
          g.actionType === 'MOVE_IN_SCHEDULED_TODAY' ||
          g.actionType === 'MOVE_OUT_SCHEDULED_TODAY' ||
          g.actionType === 'RESERVATION_STARTING_TODAY',
      )
      .reduce((sum, g) => sum + g.count, 0);
  }, [pendingActions?.groups]);

  const totalCount = pendingActions?.totalCount ?? 0;

  return (
    <Screen scrollable contentStyle={styles.content}>
      <MealFormHero
        icon={Clock3}
        eyebrow={t('dashboard.pendingActions.eyebrow', { defaultValue: 'Dashboard' })}
        heading={t('dashboard.attention.pendingActions')}
        subheading={
          empty
            ? t('dashboard.pendingActions.empty')
            : t('dashboard.attention.pendingActionsSubtitle', { count: totalCount })
        }
        compact
      />

      {showInitialLoader ? (
        <View style={styles.loadingWrap}>
          <View style={styles.kpiRow}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.kpiSkeleton}>
                <Skeleton width={28} height={28} borderRadius={radius.sm} />
                <Skeleton width={36} height={18} />
                <Skeleton width={48} height={12} />
              </View>
            ))}
          </View>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : empty ? (
        <EmptyState
          Icon={CheckCircle2}
          title={t('dashboard.pendingActions.emptyTitle', {
            defaultValue: 'All clear',
          })}
          description={t('dashboard.pendingActions.empty')}
        />
      ) : (
        <>
          <View style={styles.kpiRow}>
            <DashboardStatCard
              label={t('dashboard.pendingActions.kpi.pending', {
                defaultValue: 'Pending',
              })}
              value={String(totalCount)}
              icon={Clock3}
              accent={colors.primaryDark}
              compact
            />
            <DashboardStatCard
              label={t('dashboard.pendingActions.kpi.critical', {
                defaultValue: 'Critical',
              })}
              value={String(criticalCount)}
              icon={TriangleAlert}
              accent={criticalCount > 0 ? '#DC2626' : colors.muted}
              compact
            />
            <DashboardStatCard
              label={t('dashboard.pendingActions.kpi.today', {
                defaultValue: 'Today',
              })}
              value={String(todayCount)}
              icon={Clock3}
              accent={todayCount > 0 ? '#D97706' : colors.muted}
              compact
            />
          </View>
          <PendingActionsList spaceId={spaceId} groups={pendingActions?.groups ?? []} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  loadingWrap: {
    gap: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiSkeleton: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
});
