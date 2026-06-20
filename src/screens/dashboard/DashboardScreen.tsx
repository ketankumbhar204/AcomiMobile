import React, { useCallback, useMemo } from 'react';
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
import {
  DashboardAccommodationOperations,
  DashboardFinancialSnapshot,
  DashboardMealOperations,
  DashboardSectionTitle,
} from '../../components/dashboard';
import { DashboardCustomerMealsSection } from '../../components/meals/DashboardCustomerMealsSection';
import { ModuleActionCard, SkeletonCard } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { openOccupancyWizardFromRef } from '../../features/occupancy/OccupancyWizard';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useSpaceDashboard } from '../../hooks/useSpaceDashboard';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import {
  navigateToMembersTab,
  navigateToPaymentsTab,
} from '../../navigation/navigationRef';
import { useAccommodationActionSheetStore } from '../../store/accommodationActionSheetStore';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';
import { canManagePayments, canViewOperationalDashboard } from '../../utils/dashboardFinancial';
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
  const isMess = spaceType === 'MESS';
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
  const showOwnerDashboard = canViewOperationalDashboard({
    canManageMembers: permissions.canManageMembers,
    canManageMeals: showMealsActions,
    canManageOccupancy: showResidentsActions,
    canViewSpaceOccupancies: permissions.canViewSpaceOccupancies === true,
  });
  const showPaymentsQuickAction = canManagePayments(permissions.membershipRole);

  const dashboard = useSpaceDashboard(spaceId, spaceType, showOwnerDashboard);

  const handlePaymentsNavigate = useCallback(
    (initialFilter: 'all' | 'pending' | 'collected') => {
      navigation.navigate('Payments', { spaceId, initialFilter });
    },
    [navigation, spaceId],
  );

  const handleMealsPress = useCallback(() => {
    const tomorrow = tomorrowIsoDate();
    openActionSheet(t('dashboard.quickActions.meals'), [
      {
        label: t('dashboard.quickActions.mealsPlanning'),
        action: () => navigateMainStack('MenuPlanning', { spaceId }),
      },
      {
        label: t('meals.planning.shareTomorrow'),
        action: () =>
          navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow }),
      },
      {
        label: t('meals.todayMenu'),
        action: () => navigateMainStack('DailyMenuToday', { spaceId }),
      },
      {
        label: t('meals.library.title'),
        action: () => navigateMainStack('MenuLibrary', { spaceId }),
      },
    ]);
  }, [openActionSheet, spaceId, t]);

  const handleMembersPress = useCallback(() => {
    openActionSheet(t('dashboard.quickActions.members'), [
      {
        label: t('dashboard.quickActions.addCustomer'),
        action: () => navigateMainStack('AddMember', { spaceId }),
      },
      {
        label: t('dashboard.quickActions.viewMembers'),
        action: () => navigateToMembersTab(spaceId),
      },
    ]);
  }, [openActionSheet, spaceId, t]);

  const handlePaymentsPress = useCallback(() => {
    navigateToPaymentsTab(spaceId);
  }, [spaceId]);

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

  const messQuickActions = useMemo(() => {
    if (!showMealsActions || !isMess) {
      return null;
    }

    return (
      <View style={styles.quickStack}>
        <ModuleActionCard
          icon="🍽"
          title={t('dashboard.quickActions.meals')}
          subtitle={t('dashboard.quickActions.mealsSubtitle')}
          onPress={handleMealsPress}
        />
        <ModuleActionCard
          icon="👥"
          title={t('dashboard.quickActions.members')}
          subtitle={t('dashboard.quickActions.membersSubtitle')}
          onPress={handleMembersPress}
        />
        <ModuleActionCard
          icon="💳"
          title={t('dashboard.quickActions.payments')}
          subtitle={t('dashboard.quickActions.paymentsSubtitle')}
          onPress={handlePaymentsPress}
        />
      </View>
    );
  }, [handleMealsPress, handleMembersPress, handlePaymentsPress, isMess, showMealsActions, t]);

  const accommodationQuickActions = useMemo(() => {
    if (showResidentsActions || (showMealsActions && !isMess)) {
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
          {showMealsActions && !isMess ? (
            <ModuleActionCard
              icon="🍽"
              title={t('dashboard.quickActions.meals')}
              subtitle={t('dashboard.quickActions.mealsSubtitle')}
              onPress={handleMealsPress}
            />
          ) : null}
          {!isMess && showPaymentsQuickAction ? (
            <ModuleActionCard
              icon="💳"
              title={t('dashboard.quickActions.payments')}
              subtitle={t('dashboard.quickActions.paymentsSubtitle')}
              onPress={handlePaymentsPress}
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
    handlePaymentsPress,
    handleResidentsPress,
    isMess,
    isTenant,
    linkedMemberId,
    showMealsActions,
    showMyStay,
    showResidentsActions,
    showPaymentsQuickAction,
    t,
  ]);

  const quickActions = isMess ? messQuickActions : accommodationQuickActions;
  const showQuickSection = quickActions != null;

  return (
    <Screen scrollable contentStyle={styles.content}>
      {spaceEntry && !showOwnerDashboard ? (
        <View style={styles.spaceDetails}>
          <Text style={styles.spaceName}>{spaceEntry.spaceName}</Text>
          <Text style={styles.spaceType}>
            {spaceType ? formatSpaceType(spaceType) : ''}
          </Text>
        </View>
      ) : null}

      {isMealParticipant ? <DashboardCustomerMealsSection spaceId={spaceId} /> : null}

      {showOwnerDashboard ? (
        <>
          {dashboard.loading && !dashboard.summary ? (
            <SkeletonCard />
          ) : (
            <>
              <DashboardFinancialSnapshot
                loading={dashboard.financialLoading}
                financial={dashboard.financial}
                onExpectedPress={
                  showPaymentsQuickAction ? () => handlePaymentsNavigate('all') : undefined
                }
                onCollectedPress={
                  showPaymentsQuickAction ? () => handlePaymentsNavigate('collected') : undefined
                }
                onPendingPress={
                  showPaymentsQuickAction ? () => handlePaymentsNavigate('pending') : undefined
                }
              />

              {dashboard.messOperations ? (
                <DashboardMealOperations spaceId={spaceId} />
              ) : null}

              {dashboard.accommodationOperations ? (
                <DashboardAccommodationOperations
                  operations={dashboard.accommodationOperations}
                />
              ) : null}
            </>
          )}
        </>
      ) : null}

      {showQuickSection ? (
        <View style={styles.quickSection}>
          <DashboardSectionTitle title={t('dashboard.quickActions.title')} />
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
  quickSection: { marginBottom: spacing.lg },
  moduleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickStack: {
    gap: spacing.sm,
  },
  tenantHint: {
    ...typography.body,
    color: colors.muted,
  },
});
