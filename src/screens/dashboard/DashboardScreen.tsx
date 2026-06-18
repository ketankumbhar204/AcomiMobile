import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { formatSpaceType } from '../../api';
import { mealsApi } from '../../api/mealsApi';
import { DashboardCustomerMealsSection } from '../../components/meals/DashboardCustomerMealsSection';
import { DashboardOwnerPollStatusCard } from '../../components/meals/DashboardOwnerPollStatusCard';
import { MetricCard, MetricCardProgress, ModuleActionCard } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { openOccupancyWizardFromRef } from '../../features/occupancy/OccupancyWizard';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useAccommodationActionSheetStore } from '../../store/accommodationActionSheetStore';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { findMySpaceEntry } from '../../utils/spacePermissions';

type DashboardRoute = RouteProp<SpaceTabParamList, 'Dashboard'>;
type DashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<DashboardNav>();
  const route = useRoute<DashboardRoute>();
  const { spaceId } = route.params;
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceEntry = findMySpaceEntry(mySpaces, spaceId);
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType ?? spaceEntry?.spaceType;
  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const { memberId: linkedMemberId } = useLinkedMember(spaceId);
  const openActionSheet = useAccommodationActionSheetStore(state => state.open);

  const isTenant = permissions.membershipRole === 'TENANT';
  const isCustomer = permissions.membershipRole === 'CUSTOMER';
  const showResidentsActions = permissions.canManageOccupancy && accommodationApplicable;
  const showMealsActions = permissions.canManageMeals === true;
  const showMealsReadOnly =
    !showMealsActions && permissions.canViewMeals === true && (isTenant || isCustomer);
  const showMyStay = isTenant && linkedMemberId != null && accommodationApplicable;
  const isMealParticipant = showMealsReadOnly;

  const [eligibleMealCount, setEligibleMealCount] = useState<string>('—');

  useEffect(() => {
    if (!permissions.canViewMeals || isMealParticipant) {
      return;
    }
    const menuDate = tomorrowIsoDate();
    void mealsApi
      .getEligibilitySummary(spaceId, menuDate)
      .then(summary => {
        const total =
          summary.distinctEligibleMemberCount ??
          summary.slots.reduce((max, slot) => Math.max(max, slot.eligibleCount), 0);
        setEligibleMealCount(String(total));
      })
      .catch(() => setEligibleMealCount('—'));
  }, [isMealParticipant, permissions.canViewMeals, spaceId]);

  const handleMealsPress = useCallback(() => {
    const tomorrow = tomorrowIsoDate();
    openActionSheet(t('dashboard.quickActions.meals'), [
      {
        label: t('dashboard.quickActions.mealsPlanning'),
        action: () => navigation.navigate('MenuPlanning', { spaceId }),
      },
      {
        label: t('meals.planning.shareTomorrow'),
        action: () =>
          navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow }),
      },
      {
        label: t('meals.todayMenu'),
        action: () => navigation.navigate('DailyMenuToday', { spaceId }),
      },
      {
        label: t('meals.library.title'),
        action: () => navigation.navigate('MenuLibrary', { spaceId }),
      },
    ]);
  }, [navigation, openActionSheet, spaceId, t]);

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

  const handleMyStayPress = useCallback(() => {
    if (!linkedMemberId) {
      return;
    }
    navigation.navigate('MemberDetails', { spaceId, memberId: linkedMemberId });
  }, [linkedMemberId, navigation, spaceId]);

  const quickActions = useMemo(() => {
    if (showResidentsActions || showMealsActions) {
      return (
        <View style={styles.moduleRow}>
          {showResidentsActions ? (
            <ModuleActionCard
              icon="👥"
              title={t('dashboard.quickActions.residents')}
              subtitle={t('dashboard.quickActions.residentsSubtitle')}
              onPress={handleResidentsPress}
            />
          ) : null}
          {showMealsActions ? (
            <ModuleActionCard
              icon="🍽"
              title={t('dashboard.quickActions.meals')}
              subtitle={t('dashboard.quickActions.mealsSubtitle')}
              onPress={handleMealsPress}
            />
          ) : null}
        </View>
      );
    }

    if (showMyStay) {
      return (
        <ModuleActionCard
          icon="🏠"
          title={t('permissions.myStay.title')}
          subtitle={t('permissions.myStay.subtitle')}
          onPress={handleMyStayPress}
        />
      );
    }

    if (isTenant && !linkedMemberId) {
      return (
        <Text style={styles.tenantHint}>{t('permissions.myStay.noLinkedMember')}</Text>
      );
    }

    return null;
  }, [
    handleMealsPress,
    handleMyStayPress,
    handleResidentsPress,
    isTenant,
    linkedMemberId,
    showMealsActions,
    showMyStay,
    showResidentsActions,
    t,
  ]);

  const showQuickSection = quickActions != null;

  return (
    <Screen scrollable contentStyle={styles.content}>
      {spaceEntry ? (
        <View style={styles.spaceDetails}>
          <Text style={styles.spaceName}>{spaceEntry.spaceName}</Text>
          <Text style={styles.spaceType}>
            {spaceType ? formatSpaceType(spaceType) : ''}
          </Text>
        </View>
      ) : null}

      {isMealParticipant ? <DashboardCustomerMealsSection spaceId={spaceId} /> : null}

      {!isMealParticipant ? (
        <>
          <Text style={styles.dashboardTitle}>{t('dashboard.overview')}</Text>

          <View style={styles.metricsRow}>
            {accommodationApplicable ? (
              <MetricCard label={t('dashboard.occupancy')} value="94%" style={styles.metricHalf} />
            ) : null}
            {permissions.canViewMeals ? (
              <MetricCard
                label={t('dashboard.eligibleMembers')}
                value={eligibleMealCount}
                hint={t('dashboard.eligibleMembersHint')}
                hintPositive
                style={accommodationApplicable ? styles.metricHalf : styles.metricFull}
              />
            ) : null}
          </View>
          {accommodationApplicable ? (
            <MetricCard
              label={t('dashboard.rentCollected')}
              value="₹ 4,28,500"
              hint={t('dashboard.rentHint')}
              hintPositive
              style={styles.rentMetric}>
              <MetricCardProgress percent={78} />
            </MetricCard>
          ) : null}
        </>
      ) : null}

      {showMealsActions ? <DashboardOwnerPollStatusCard spaceId={spaceId} /> : null}

      {showQuickSection ? (
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>{t('dashboard.quickActions.title')}</Text>
          {quickActions}
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
  metricFull: { flex: 1, width: '100%' },
  rentMetric: { marginBottom: spacing.xl },
  quickSection: { marginBottom: spacing.lg },
  quickTitle: { ...typography.h3, marginBottom: spacing.md },
  moduleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tenantHint: {
    ...typography.body,
    color: colors.muted,
  },
});
