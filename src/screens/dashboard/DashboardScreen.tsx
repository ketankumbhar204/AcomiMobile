import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { formatSpaceType } from '../../api';
import { MetricCard, MetricCardProgress, ModuleActionCard } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { openOccupancyWizardFromRef } from '../../features/occupancy/OccupancyWizard';
import type { SpaceTabParamList } from '../../navigation/types';
import { useAccommodationActionSheetStore } from '../../store/accommodationActionSheetStore';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import { canManageOccupancy } from '../../utils/occupancyPermissions';

type DashboardRoute = RouteProp<SpaceTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const { t } = useTranslation();
  const route = useRoute<DashboardRoute>();
  const { spaceId } = route.params;
  const selectedSpace = useSpaceStore(state => state.selectedSpace);
  const mySpaces = useSpaceStore(state => state.mySpaces);

  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );
  const canManage = canManageOccupancy(currentRole);
  const openActionSheet = useAccommodationActionSheetStore(state => state.open);

  const handleResidentsPress = useCallback(() => {
    openActionSheet(t('dashboard.quickActions.residents'), [
      {
        label: t('dashboard.quickActions.allocate'),
        action: () => openOccupancyWizardFromRef({ spaceId, mode: 'ALLOCATE' }),
      },
      {
        label: t('dashboard.quickActions.reserve'),
        action: () => openOccupancyWizardFromRef({ spaceId, mode: 'RESERVE' }),
      },
      {
        label: t('dashboard.quickActions.transfer'),
        action: () => openOccupancyWizardFromRef({ spaceId, mode: 'TRANSFER' }),
      },
      {
        label: t('dashboard.quickActions.vacate'),
        action: () => openOccupancyWizardFromRef({ spaceId, mode: 'VACATE' }),
        destructive: true,
      },
    ]);
  }, [openActionSheet, spaceId, t]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      {selectedSpace ? (
        <View style={styles.spaceDetails}>
          <Text style={styles.spaceName}>{selectedSpace.name}</Text>
          <Text style={styles.spaceType}>{formatSpaceType(selectedSpace.type)}</Text>
        </View>
      ) : null}

      <Text style={styles.dashboardTitle}>{t('dashboard.overview')}</Text>

      <View style={styles.metricsRow}>
        <MetricCard label={t('dashboard.occupancy')} value="94%" style={styles.metricHalf} />
        <MetricCard
          label={t('dashboard.todaysMeals')}
          value="42"
          hint={t('dashboard.mealsHint')}
          hintPositive
          style={styles.metricHalf}
        />
      </View>
      <MetricCard
        label={t('dashboard.rentCollected')}
        value="₹ 4,28,500"
        hint={t('dashboard.rentHint')}
        hintPositive
        style={styles.rentMetric}>
        <MetricCardProgress percent={78} />
      </MetricCard>

      {canManage ? (
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>{t('dashboard.quickActions.title')}</Text>
          <View style={styles.moduleRow}>
            <ModuleActionCard
              icon="👥"
              title={t('dashboard.quickActions.residents')}
              subtitle={t('dashboard.quickActions.residentsSubtitle')}
              onPress={handleResidentsPress}
            />
            <ModuleActionCard
              icon="🍽"
              title={t('dashboard.quickActions.meals')}
              subtitle={t('dashboard.quickActions.mealsSubtitle')}
              disabled
              comingSoonLabel={t('dashboard.quickActions.comingSoon')}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  spaceDetails: { marginBottom: spacing.lg },
  spaceName: { ...typography.h2, marginBottom: spacing.xs },
  spaceType: { ...typography.body, color: colors.muted },
  dashboardTitle: { ...typography.h1, marginBottom: spacing.lg },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricHalf: { flex: 1 },
  rentMetric: { marginBottom: spacing.xl },
  quickSection: { marginBottom: spacing.lg },
  quickTitle: { ...typography.h3, marginBottom: spacing.md },
  moduleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
