import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import { PendingActionsList } from '../../components/dashboard/PendingActionGroupCard';
import { Screen } from '../../components/ui/Screen';
import { usePendingActions } from '../../hooks/usePendingActions';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { canViewOperationalDashboard } from '../../utils/dashboardFinancial';

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
  const showOwnerDashboard = canViewOperationalDashboard({
    canManageMembers: permissions.canManageMembers,
    canManageMeals: permissions.canManageMeals === true,
    canManageOccupancy: permissions.canManageOccupancy,
    canViewSpaceOccupancies: permissions.canViewSpaceOccupancies === true,
  });

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

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.subtitle}>{t('dashboard.pendingActions.screenSubtitle')}</Text>

      {showInitialLoader ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : empty ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('dashboard.pendingActions.empty')}</Text>
        </View>
      ) : (
        <PendingActionsList spaceId={spaceId} groups={pendingActions?.groups ?? []} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
