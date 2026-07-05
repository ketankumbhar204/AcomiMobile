import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import { DashboardPendingActionsList } from '../../components/dashboard/DashboardAttentionCard';
import { Screen } from '../../components/ui/Screen';
import { useDashboardAttentionItems } from '../../hooks/useDashboardAttentionItems';
import { useSpaceDashboard } from '../../hooks/useSpaceDashboard';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceStore } from '../../store/spaceStore';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { findMySpaceEntry } from '../../utils/spacePermissions';

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
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceEntry = findMySpaceEntry(mySpaces, spaceId);
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType ?? spaceEntry?.spaceType;
  const isMess = spaceType === 'MESS';

  const dashboard = useSpaceDashboard(spaceId, spaceType, true);
  const items = useDashboardAttentionItems(
    spaceId,
    dashboard.attention,
    permissions.canManageMeals === true && isMess,
  );

  const showInitialLoader = dashboard.loading && dashboard.summary == null;
  const empty = useMemo(
    () => !showInitialLoader && !dashboard.refreshing && items.length === 0,
    [dashboard.refreshing, items.length, showInitialLoader],
  );

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
        <DashboardPendingActionsList spaceId={spaceId} items={items} />
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
