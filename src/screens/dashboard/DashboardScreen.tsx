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
  DashboardMessOperations,
  DashboardSectionTitle,
} from '../../components/dashboard';
import { DashboardCustomerMealsSection } from '../../components/meals/DashboardCustomerMealsSection';
import { ModuleActionCard, SkeletonCard, useQuickActionSheet } from '../../components/ui';
import type { QuickActionSheetOption } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useDashboardAccommodationOperationsQuick } from '../../hooks/useDashboardAccommodationOperationsQuick';
import { useDashboardAttentionItems } from '../../hooks/useDashboardAttentionItems';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useHierarchyOccupancyPicker } from '../../hooks/useHierarchyOccupancyPicker';
import { useNavigateFromSpaceTab } from '../../hooks/useNavigateFromSpaceTab';
import { usePendingActions } from '../../hooks/usePendingActions';
import { useSpaceDashboard } from '../../hooks/useSpaceDashboard';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import {
  navigateToMembersTab,
  navigateToPaymentsTab,
} from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';
import { canManagePayments, canViewOperationalDashboard, currentMonthKey } from '../../utils/dashboardFinancial';
import { peekDashboardSummary } from '../../utils/dashboardQueryCache';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { shouldShowDashboardMealOperations } from '../../utils/dashboardMealOperations';
import { findMySpaceEntry } from '../../utils/spacePermissions';

type DashboardRoute = RouteProp<SpaceTabParamList, 'Dashboard'>;
type DashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<MainStackParamList>
>;

function PendingActionsQuickCard({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ModuleActionCard
      icon="🔔"
      title={t('dashboard.quickActions.pendingActions')}
      subtitle={t('dashboard.quickActions.pendingActionsSubtitle', { count })}
      badgeCount={count}
      trailing="forward"
      highlight
      fullWidth
      onPress={onPress}
    />
  );
}

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
  const { memberId: linkedMemberId, member: linkedMember } = useLinkedMember(spaceId);
  const { showQuickActionSheet } = useQuickActionSheet();
  const hierarchyPicker = useHierarchyOccupancyPicker(spaceId, spaceType);
  const navigateFromTab = useNavigateFromSpaceTab();

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
  const hasSummaryAccommodation = dashboard.accommodationOperations != null;
  const quickAccommodation = useDashboardAccommodationOperationsQuick(
    spaceId,
    showOwnerDashboard && accommodationApplicable && !hasSummaryAccommodation,
  );
  const accommodationOperations =
    dashboard.accommodationOperations ?? quickAccommodation.operations;
  const handleDashboardRefresh = useCallback(() => {
    void dashboard.reload(true);
    void quickAccommodation.reload();
  }, [dashboard.reload, quickAccommodation.reload]);
  const showMealOperations = shouldShowDashboardMealOperations({
    showOwnerDashboard,
    canManageMeals: showMealsActions,
    isMess,
    accommodationApplicable,
    hasMessOperationsSummary: dashboard.messOperations != null,
  });
  const cachedAttention =
    peekDashboardSummary(spaceId, currentMonthKey())?.attention ?? [];
  const attentionSource =
    (dashboard.attention?.length ?? 0) > 0 ? dashboard.attention : cachedAttention;
  const legacyAttentionItems = useDashboardAttentionItems(
    spaceId,
    attentionSource ?? [],
    showOwnerDashboard && showMealsActions,
  );
  const pendingActions =
    dashboard.pendingActions ??
    peekDashboardSummary(spaceId, currentMonthKey())?.pendingActions ??
    null;
  // Owners: prefer dashboard-summary.pendingActions (already synced once).
  // Tenants: dedicated pending-actions fetch (filtered). Shared cache dedupes with the bell.
  const tenantPendingActions = usePendingActions(spaceId, !showOwnerDashboard, false);
  const pendingActionCount = showOwnerDashboard
    ? (pendingActions?.totalCount ??
      (pendingActions == null ? legacyAttentionItems.length : 0))
    : tenantPendingActions.totalCount;

  const handlePendingActionsPress = useCallback(() => {
    navigateFromTab('DashboardPendingActions', { spaceId });
  }, [navigateFromTab, spaceId]);

  const handlePaymentsNavigate = useCallback(
    (initialFilter: 'all' | 'pending' | 'collected') => {
      navigation.navigate('Payments', { spaceId, initialFilter });
    },
    [navigation, spaceId],
  );

  const handleOccupiedBedsPress = useCallback(() => {
    navigateFromTab('DashboardOccupancyList', { spaceId, mode: 'active' });
  }, [navigateFromTab, spaceId]);

  const handleVacantBedsPress = useCallback(() => {
    navigateFromTab('DashboardBedInventory', { spaceId, status: 'AVAILABLE' });
  }, [navigateFromTab, spaceId]);

  const handleMoveInsPress = useCallback(() => {
    navigateFromTab('DashboardOccupancyList', { spaceId, mode: 'moveInsThisMonth' });
  }, [navigateFromTab, spaceId]);

  const handleMealsPress = useCallback(() => {
    const tomorrow = tomorrowIsoDate();
    const actions: QuickActionSheetOption[] = [
      {
        label: t('dashboard.quickActions.mealsPlanning'),
        action: () => navigateFromTab('MenuPlanning', { spaceId }),
      },
      {
        label: t('meals.planning.shareTomorrow'),
        action: () => navigateFromTab('MenuSharePreview', { spaceId, menuDate: tomorrow }),
      },
      {
        label: t('meals.todayMenu'),
        action: () => navigateFromTab('DailyMenuToday', { spaceId }),
      },
      {
        label: t('meals.library.title'),
        action: () => navigateFromTab('MenuLibrary', { spaceId }),
      },
      {
        label: t('meals.subscriptionPlans.title'),
        action: () => navigateFromTab('SubscriptionPlans', { spaceId }),
      },
    ];
    if (isMess) {
      actions.push({
        label: t('dashboard.quickActions.deliveryLocations'),
        action: () => navigateFromTab('MealDeliveryLocations', { spaceId }),
      });
    }
    showQuickActionSheet(t('dashboard.quickActions.meals'), actions);
  }, [isMess, navigateFromTab, showQuickActionSheet, spaceId, t]);

  const handleDeliveryLocationsPress = useCallback(() => {
    navigateFromTab('MealDeliveryLocations', { spaceId });
  }, [navigateFromTab, spaceId]);

  const handleMembersPress = useCallback(() => {
    showQuickActionSheet(t('dashboard.quickActions.members'), [
      {
        label: t('dashboard.quickActions.addCustomer'),
        action: () => navigateFromTab('AddMember', { spaceId }),
      },
      {
        label: t('dashboard.quickActions.viewMembers'),
        action: () => navigateToMembersTab(spaceId),
      },
    ]);
  }, [navigateFromTab, showQuickActionSheet, spaceId, t]);

  const handlePaymentsPress = useCallback(() => {
    navigateToPaymentsTab(spaceId);
  }, [spaceId]);

  const handleResidentsPress = useCallback(() => {
    showQuickActionSheet(t('dashboard.quickActions.residents'), [
      {
        label: t('dashboard.quickActions.allocate'),
        action: () => hierarchyPicker.openFromSpace('ALLOCATE'),
      },
      {
        label: t('dashboard.quickActions.reserve'),
        action: () => hierarchyPicker.openFromSpace('RESERVE'),
      },
      {
        label: t('dashboard.quickActions.transfer'),
        action: () => navigateFromTab('OccupancyWizard', { spaceId, mode: 'TRANSFER' }),
      },
      {
        label: t('dashboard.quickActions.vacate'),
        action: () => navigateFromTab('OccupancyWizard', { spaceId, mode: 'VACATE' }),
        destructive: true,
      },
    ]);
  }, [hierarchyPicker, navigateFromTab, showQuickActionSheet, spaceId, t]);

  const handleMyPaymentsPress = useCallback(() => {
    if (!linkedMemberId || !linkedMember) {
      return;
    }
    navigateFromTab('MemberPayments', {
      spaceId,
      memberId: linkedMemberId,
      memberName: linkedMember.fullName,
    });
  }, [linkedMember, linkedMemberId, navigateFromTab, spaceId]);

  const handleMyStayPress = useCallback(() => {
    if (!linkedMemberId) {
      return;
    }
    navigateFromTab('MemberDetails', { spaceId, memberId: linkedMemberId });
  }, [linkedMemberId, navigateFromTab, spaceId]);

  const pendingActionsCard =
    pendingActionCount > 0 ? (
      <PendingActionsQuickCard count={pendingActionCount} onPress={handlePendingActionsPress} />
    ) : null;

  const messQuickActions = useMemo(() => {
    if (!showMealsActions || !isMess) {
      return null;
    }

    return (
      <View style={styles.quickStack}>
        {pendingActionsCard}
        <ModuleActionCard
          icon="🍽"
          title={t('dashboard.quickActions.meals')}
          subtitle={t('dashboard.quickActions.mealsSubtitle')}
          onPress={handleMealsPress}
        />
        <ModuleActionCard
          icon="📍"
          title={t('dashboard.quickActions.deliveryLocations')}
          subtitle={t('dashboard.quickActions.deliveryLocationsSubtitle')}
          onPress={handleDeliveryLocationsPress}
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
  }, [
    handleDeliveryLocationsPress,
    handleMealsPress,
    handleMembersPress,
    handlePaymentsPress,
    isMess,
    pendingActionsCard,
    showMealsActions,
    t,
  ]);

  const accommodationQuickActions = useMemo(() => {
    if (showResidentsActions || (showMealsActions && !isMess)) {
      return (
        <View style={styles.quickStack}>
          {pendingActionsCard}
          {showResidentsActions ? (
            <ModuleActionCard
              icon="👥"
              title={t('dashboard.quickActions.residents')}
              subtitle={t('dashboard.quickActions.residentsSubtitle')}
              trailing="forward"
              fullWidth
              onPress={handleResidentsPress}
            />
          ) : null}
          {showMealsActions && !isMess ? (
            <ModuleActionCard
              icon="🍽"
              title={t('dashboard.quickActions.meals')}
              subtitle={t('dashboard.quickActions.mealsSubtitle')}
              trailing="forward"
              fullWidth
              onPress={handleMealsPress}
            />
          ) : null}
          {!isMess && showPaymentsQuickAction ? (
            <ModuleActionCard
              icon="💳"
              title={t('dashboard.quickActions.payments')}
              subtitle={t('dashboard.quickActions.paymentsSubtitle')}
              trailing="forward"
              fullWidth
              onPress={handlePaymentsPress}
            />
          ) : null}
        </View>
      );
    }

    if (showMyStay) {
      return (
        <View style={styles.quickStack}>
          {pendingActionsCard}
          <ModuleActionCard
            icon="🏠"
            title={t('permissions.myStay.title')}
            subtitle={t('permissions.myStay.subtitle')}
            onPress={handleMyStayPress}
          />
          <ModuleActionCard
            icon="💳"
            title={t('paymentCollection.memberPayments.dashboardTitle')}
            subtitle={t('paymentCollection.memberPayments.dashboardSubtitle')}
            onPress={handleMyPaymentsPress}
          />
        </View>
      );
    }

    if ((isTenant || isCustomer) && linkedMemberId) {
      return (
        <View style={styles.quickStack}>
          {pendingActionsCard}
          <ModuleActionCard
            icon="💳"
            title={t('paymentCollection.memberPayments.dashboardTitle')}
            subtitle={t('paymentCollection.memberPayments.dashboardSubtitle')}
            onPress={handleMyPaymentsPress}
          />
        </View>
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
    handleMyPaymentsPress,
    handleMyStayPress,
    handlePaymentsPress,
    handleResidentsPress,
    isMess,
    isCustomer,
    isTenant,
    linkedMemberId,
    pendingActionsCard,
    showMealsActions,
    showMyStay,
    showResidentsActions,
    showPaymentsQuickAction,
    t,
  ]);

  const quickActions = isMess ? messQuickActions : accommodationQuickActions;
  const showQuickSection = quickActions != null || pendingActionsCard != null;

  const showInitialDashboardLoader =
    dashboard.loading &&
    dashboard.summary == null &&
    quickAccommodation.operations == null;

  return (
    <Screen
      scrollable
      contentStyle={styles.content}
      refreshing={dashboard.refreshing}
      onRefresh={showOwnerDashboard ? handleDashboardRefresh : undefined}>
      {hierarchyPicker.pickerModal}
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
          {showInitialDashboardLoader ? (
            <SkeletonCard />
          ) : null}

          {dashboard.summary || !showInitialDashboardLoader ? (
            <>
              <DashboardFinancialSnapshot
                loading={dashboard.financialLoading && dashboard.financial == null}
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

              {isMess && dashboard.messOperations ? (
                <DashboardMessOperations
                  operations={dashboard.messOperations}
                  onMembersPress={
                    permissions.canManageMembers
                      ? () => navigateToMembersTab(spaceId)
                      : undefined
                  }
                  onMenusPress={
                    showMealsActions
                      ? () => navigateFromTab('MenuPlanning', { spaceId })
                      : undefined
                  }
                  onPollsPress={
                    showMealsActions
                      ? () => navigateFromTab('MenuSharePreview', { spaceId })
                      : undefined
                  }
                  onHeadcountPress={
                    showMealsActions
                      ? () => navigateFromTab('DailyMenuToday', { spaceId })
                      : undefined
                  }
                />
              ) : null}

              {isMess && showMealOperations ? (
                <DashboardMealOperations spaceId={spaceId} enabled={showMealOperations} />
              ) : null}

              {accommodationOperations ? (
                <DashboardAccommodationOperations
                  operations={accommodationOperations}
                  onOccupiedPress={
                    showResidentsActions || permissions.canViewSpaceOccupancies
                      ? handleOccupiedBedsPress
                      : undefined
                  }
                  onVacantPress={
                    showResidentsActions || permissions.canViewSpaceOccupancies
                      ? handleVacantBedsPress
                      : undefined
                  }
                  onMoveInsPress={
                    showResidentsActions || permissions.canViewSpaceOccupancies
                      ? handleMoveInsPress
                      : undefined
                  }
                />
              ) : null}

              {!isMess && showMealOperations ? (
                <DashboardMealOperations spaceId={spaceId} enabled={showMealOperations} />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {showQuickSection ? (
        <View style={styles.quickSection}>
          <DashboardSectionTitle title={t('dashboard.quickActions.title')} />
          {quickActions ?? (
            <View style={styles.quickStack}>{pendingActionsCard}</View>
          )}
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
  quickStack: {
    gap: spacing.sm,
  },
  tenantHint: {
    ...typography.body,
    color: colors.muted,
  },
});
