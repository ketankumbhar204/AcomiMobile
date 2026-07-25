import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Bell, Crown, MapPin, Share2, Users, UtensilsCrossed, Wallet } from 'lucide-react-native';
import { formatSpaceType, getSpaceTypeLabel } from '../../api';
import {
  DashboardAccommodationOperations,
  DashboardFinancialSnapshot,
  DashboardMealOperations,
  DashboardOwnerLoadingSkeleton,
  DashboardSectionTitle,
  DashboardSetupProgressCard,
} from '../../components/dashboard';
import { DashboardActionRow } from '../../components/dashboard/shared/DashboardActionRow';
import { DashboardOwnerHero } from '../../components/dashboard/shared/DashboardOwnerHero';
import { DashboardCustomerMealsSection } from '../../components/meals/DashboardCustomerMealsSection';
import { ModuleActionCard, useQuickActionSheet } from '../../components/ui';
import type { QuickActionSheetOption } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useDashboardAccommodationOperationsQuick } from '../../hooks/useDashboardAccommodationOperationsQuick';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useHierarchyOccupancyPicker } from '../../hooks/useHierarchyOccupancyPicker';
import { useNavigateFromSpaceTab } from '../../hooks/useNavigateFromSpaceTab';
import { usePendingActions } from '../../hooks/usePendingActions';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpaceDashboard } from '../../hooks/useSpaceDashboard';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceLifecycle } from '../../hooks/useSpaceLifecycle';
import { useSpaceLifecycleSignals } from '../../hooks/useSpaceLifecycleSignals';
import { useSpaceHealth } from '../../spaceLifecycle/health';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import {
  navigateToMembersTab,
  navigateToPaymentsTab,
} from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import { canManageNotifications } from '../../utils/spaceOperator';
import { peekDashboardSummary } from '../../utils/dashboardQueryCache';
import { peekPendingActions } from '../../utils/pendingActionsQueryCache';
import { todayIsoDate, tomorrowIsoDate } from '../../utils/mealDates';
import { shouldShowDashboardMealOperations } from '../../utils/dashboardMealOperations';
import {
  dismissOptionalMilestone,
  loadDismissedOptionalMilestones,
  saveDismissedOptionalMilestones,
  undismissOptionalMilestone,
} from '../../utils/setupMilestoneDismissals';
import type { MilestoneId, SetupNavigationTarget } from '../../spaceLifecycle';
import { findMySpaceEntry } from '../../utils/spacePermissions';
import {
  dashboardVisibilityForLifecycle,
  mapSetupNavigationTarget,
  shouldShowSetupChrome,
} from '../../spaceLifecycle';
import {
  hasAutoOpenedAccommodation,
  markAutoOpenedAccommodation,
} from '../../utils/spaceSetupStorage';
import { CoachmarkSequence } from '../../components/coachmarks';
import { ENABLE_SETUP_COACHMARKS } from '../../coachmarks';

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
    <DashboardActionRow
      icon={Bell}
      accent="#D97706"
      highlight
      badgeCount={count}
      title={t('dashboard.quickActions.pendingActions')}
      subtitle={t('dashboard.quickActions.pendingActionsSubtitle', { count })}
      onPress={onPress}
    />
  );
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<DashboardNav>();
  const route = useRoute<DashboardRoute>();
  const spaceId = useActiveSpaceId(route.params.spaceId);
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
  const showOwnerDashboard = canManageNotifications(permissions);
  const showPaymentsQuickAction = canManagePayments(permissions.membershipRole);
  const canViewAccommodation = permissions.canViewAccommodation === true;
  const autoNavAttemptedRef = useRef<string | null>(null);

  const dashboard = useSpaceDashboard(spaceId, spaceType, showOwnerDashboard);
  const hasSummaryAccommodation = dashboard.accommodationOperations != null;
  const quickAccommodation = useDashboardAccommodationOperationsQuick(
    spaceId,
    showOwnerDashboard && accommodationApplicable && !hasSummaryAccommodation,
  );
  const accommodationOperations =
    dashboard.accommodationOperations ?? quickAccommodation.operations;

  const pendingActions =
    dashboard.pendingActions ??
    peekDashboardSummary(spaceId, currentMonthKey())?.pendingActions ??
    null;
  const tenantPendingActions = usePendingActions(spaceId, !showOwnerDashboard, false);
  const monthKey = currentMonthKey();
  // Prefer live dashboard summary once available — peeks are fallback only.
  const pendingActionCount = showOwnerDashboard
    ? (pendingActions?.totalCount ??
      peekPendingActions(spaceId, monthKey)?.totalCount ??
      0)
    : tenantPendingActions.totalCount;

  const hasOperationalSignal = useMemo(() => {
    const occupied = accommodationOperations?.occupiedBeds ?? 0;
    const moveIns = accommodationOperations?.moveInsThisMonth ?? 0;
    const collected = dashboard.financial?.collected ?? 0;
    return occupied > 0 || moveIns > 0 || collected > 0;
  }, [
    accommodationOperations?.moveInsThisMonth,
    accommodationOperations?.occupiedBeds,
    dashboard.financial?.collected,
  ]);

  const [dismissedOptionalIds, setDismissedOptionalIds] = useState<MilestoneId[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void loadDismissedOptionalMilestones(spaceId).then(ids => {
      if (cancelled) {
        return;
      }
      // Do not keep a stale "skipped customers" across visits when the owner
      // still has no customers — Add customers should be selected on land.
      const withoutCustomersSkip = ids.filter(id => id !== 'RESIDENTS_READY');
      setDismissedOptionalIds(withoutCustomersSkip);
      if (withoutCustomersSkip.length !== ids.length) {
        void saveDismissedOptionalMilestones(spaceId, withoutCustomersSkip);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const {
    context: lifecycleContext,
    loading: lifecycleLoading,
    refresh: refreshLifecycle,
    needsPropertyStructure,
  } = useSpaceLifecycleSignals({
    spaceId,
    spaceType,
    permissions,
    enabled: showOwnerDashboard,
    pendingActionCount: showOwnerDashboard ? pendingActionCount : 0,
    hasOperationalSignal,
    dismissedOptionalMilestoneIds: dismissedOptionalIds,
  });

  const {
    lifecycle,
    progress: lifecycleProgress,
    nextRecommendedAction,
    evaluation,
  } = useSpaceLifecycle({
    spaceType,
    context: lifecycleContext,
    enabled: showOwnerDashboard,
  });

  const healthExtras = useMemo(() => {
    const financial = dashboard.financial;
    const reviewFromPending =
      pendingActions?.groups?.find(g => g.actionType === 'PAYMENT_NEEDS_REVIEW')
        ?.count ?? 0;
    return {
      occupiedBeds: accommodationOperations?.occupiedBeds ?? null,
      vacantBeds: accommodationOperations?.vacantBeds ?? null,
      underReviewPaymentCount:
        reviewFromPending > 0
          ? reviewFromPending
          : financial?.underReview != null && financial.underReview > 0
            ? 1
            : 0,
    };
  }, [
    accommodationOperations?.occupiedBeds,
    accommodationOperations?.vacantBeds,
    dashboard.financial,
    pendingActions?.groups,
  ]);

  const { health } = useSpaceHealth({
    evaluation,
    context: lifecycleContext,
    extras: healthExtras,
    enabled: showOwnerDashboard,
  });

  const visibility = useMemo(
    () => dashboardVisibilityForLifecycle(lifecycle, { spaceType }),
    [lifecycle, spaceType],
  );

  const handleDashboardRefresh = useCallback(() => {
    void dashboard.reload(true);
    void quickAccommodation.reload();
    void refreshLifecycle();
  }, [dashboard.reload, quickAccommodation.reload, refreshLifecycle]);

  const showMealOperations = shouldShowDashboardMealOperations({
    showOwnerDashboard,
    canManageMeals: showMealsActions,
    isMess,
    accommodationApplicable,
  });

  const handlePendingActionsPress = useCallback(() => {
    navigateFromTab('DashboardPendingActions', { spaceId });
  }, [navigateFromTab, spaceId]);

  const navigateToSetupTarget = useCallback(
    (target: SetupNavigationTarget) => {
      const dest = mapSetupNavigationTarget(target, { spaceType });
      if (dest.kind === 'tab') {
        if (dest.tab === 'Accommodation' && canViewAccommodation) {
          navigation.navigate('Accommodation', { spaceId });
          return;
        }
        if (dest.tab === 'Members' && permissions.canManageMembers) {
          navigateToMembersTab(spaceId);
          return;
        }
        if (dest.tab === 'Meals') {
          navigation.navigate('Meals', { spaceId });
        }
        return;
      }

      switch (dest.screen) {
        case 'QuickSetupWizard':
          navigateFromTab('QuickSetupWizard', { spaceId });
          break;
        case 'BuildingForm':
          navigateFromTab('BuildingForm', { spaceId, mode: 'create' });
          break;
        case 'AddMember':
          navigateFromTab('AddMember', { spaceId });
          break;
        case 'AddCustomersHub':
          navigateFromTab('AddCustomersHub', { spaceId });
          break;
        case 'MenuLibrary':
          navigateFromTab('MenuLibrary', { spaceId });
          break;
        case 'MenuPlanning':
          navigateFromTab('MenuPlanning', { spaceId });
          break;
        case 'MenuSharePreview':
          navigateFromTab('MenuSharePreview', {
            spaceId,
            menuDate: todayIsoDate(),
          });
          break;
        case 'MealDeliveryLocations':
          navigateFromTab('MealDeliveryLocations', { spaceId });
          break;
        case 'DashboardPendingActions':
          navigateFromTab('DashboardPendingActions', { spaceId });
          break;
        default:
          break;
      }
    },
    [
      canViewAccommodation,
      navigateFromTab,
      navigation,
      permissions.canManageMembers,
      spaceId,
      spaceType,
    ],
  );

  const handleSetupContinue = useCallback(() => {
    const target = nextRecommendedAction?.navigationTarget;
    if (!target) {
      return;
    }
    navigateToSetupTarget(target);
  }, [navigateToSetupTarget, nextRecommendedAction?.navigationTarget]);

  const handleSkipOptionalSetup = useCallback(() => {
    const milestoneId = nextRecommendedAction?.milestoneId;
    if (!milestoneId || nextRecommendedAction?.kind !== 'optional') {
      return;
    }
    void dismissOptionalMilestone(spaceId, milestoneId).then(ids => {
      setDismissedOptionalIds(ids);
    });
  }, [nextRecommendedAction?.kind, nextRecommendedAction?.milestoneId, spaceId]);

  const handleSetupStepPress = useCallback(
    (milestoneId: MilestoneId) => {
      const status = evaluation?.statuses.find(s => s.id === milestoneId);
      const target = status?.navigationTarget;
      if (!target || target === 'DASHBOARD') {
        return;
      }
      if (
        milestoneId === 'RESIDENTS_READY' &&
        dismissedOptionalIds.includes('RESIDENTS_READY')
      ) {
        void undismissOptionalMilestone(spaceId, 'RESIDENTS_READY').then(ids => {
          setDismissedOptionalIds(ids);
        });
      }
      navigateToSetupTarget(target);
    },
    [dismissedOptionalIds, evaluation?.statuses, navigateToSetupTarget, spaceId],
  );

  useEffect(() => {
    if (!showOwnerDashboard || !accommodationApplicable || !canViewAccommodation) {
      return;
    }
    if (!needsPropertyStructure || lifecycleLoading) {
      return;
    }
    if (autoNavAttemptedRef.current === spaceId) {
      return;
    }
    autoNavAttemptedRef.current = spaceId;

    let cancelled = false;
    void (async () => {
      const already = await hasAutoOpenedAccommodation(spaceId);
      if (cancelled || already) {
        return;
      }
      await markAutoOpenedAccommodation(spaceId);
      if (cancelled) {
        return;
      }
      navigation.navigate('Accommodation', { spaceId });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accommodationApplicable,
    canViewAccommodation,
    lifecycleLoading,
    navigation,
    needsPropertyStructure,
    showOwnerDashboard,
    spaceId,
  ]);

  const handlePaymentsNavigate = useCallback(
    (initialFilter: 'all' | 'pending' | 'collected' | 'underReview') => {
      navigateToPaymentsTab(spaceId, { initialFilter });
    },
    [spaceId],
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

  const handleSubscriptionPlansPress = useCallback(() => {
    navigateFromTab('SubscriptionPlans', { spaceId });
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
        <DashboardActionRow
          icon={UtensilsCrossed}
          accent={colors.primaryDark}
          title={t('dashboard.quickActions.meals')}
          subtitle={t('dashboard.quickActions.mealsSubtitle')}
          onPress={handleMealsPress}
        />
        <DashboardActionRow
          icon={MapPin}
          accent="#DC2626"
          title={t('dashboard.quickActions.deliveryLocations')}
          subtitle={t('dashboard.quickActions.deliveryLocationsSubtitle')}
          onPress={handleDeliveryLocationsPress}
        />
        <DashboardActionRow
          icon={Crown}
          accent="#7C3AED"
          title={t('meals.subscriptionPlans.title')}
          subtitle={t('dashboard.quickActions.subscriptionPlansSubtitle')}
          onPress={handleSubscriptionPlansPress}
        />
        <DashboardActionRow
          icon={Users}
          accent="#2563EB"
          title={t('dashboard.quickActions.members')}
          subtitle={t('dashboard.quickActions.membersSubtitle')}
          onPress={handleMembersPress}
        />
        <DashboardActionRow
          icon={Wallet}
          accent="#D97706"
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
    handleSubscriptionPlansPress,
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
            <DashboardActionRow
              icon={Users}
              accent="#2563EB"
              title={t('dashboard.quickActions.residents')}
              subtitle={t('dashboard.quickActions.residentsSubtitle')}
              onPress={handleResidentsPress}
            />
          ) : null}
          {showMealsActions && !isMess ? (
            <DashboardActionRow
              icon={UtensilsCrossed}
              accent={colors.primaryDark}
              title={t('dashboard.quickActions.meals')}
              subtitle={t('dashboard.quickActions.mealsSubtitle')}
              onPress={handleMealsPress}
            />
          ) : null}
          {!isMess && showPaymentsQuickAction ? (
            <DashboardActionRow
              icon={Wallet}
              accent="#D97706"
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
        <View style={styles.quickStack}>
          {pendingActionsCard}
          <ModuleActionCard
            icon="🏠"
            title={t('permissions.myStay.title')}
            subtitle={t('permissions.myStay.subtitle')}
            onPress={handleMyStayPress}
          />
          {!isMealParticipant ? (
            <ModuleActionCard
              icon="💳"
              title={t('paymentCollection.memberPayments.dashboardTitle')}
              subtitle={t('paymentCollection.memberPayments.dashboardSubtitle')}
              onPress={handleMyPaymentsPress}
            />
          ) : null}
        </View>
      );
    }

    if ((isTenant || isCustomer) && linkedMemberId && !isMealParticipant) {
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

    if ((isTenant || isCustomer) && linkedMemberId && isMealParticipant) {
      return pendingActionsCard ? (
        <View style={styles.quickStack}>{pendingActionsCard}</View>
      ) : null;
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
    isMealParticipant,
    isTenant,
    linkedMemberId,
    pendingActionsCard,
    showMealsActions,
    showMyStay,
    showResidentsActions,
    showPaymentsQuickAction,
    t,
  ]);

  const fullQuickActions = isMess ? messQuickActions : accommodationQuickActions;

  const messSetupQuickActions =
    visibility.showMessSetupQuickActions && showMealsActions && isMess ? (
      <View style={styles.quickStack}>
        {pendingActionsCard}
        <DashboardActionRow
          icon={UtensilsCrossed}
          accent={colors.primaryDark}
          title={t('dashboard.quickActions.setupCreateMenuLibrary')}
          subtitle={t('dashboard.quickActions.setupCreateMenuLibrarySubtitle')}
          onPress={() => navigateFromTab('MenuLibrary', { spaceId })}
        />
        <DashboardActionRow
          icon={Users}
          accent="#2563EB"
          title={t('dashboard.quickActions.setupAddCustomers')}
          subtitle={t('dashboard.quickActions.setupAddCustomersSubtitle')}
          onPress={() => navigateFromTab('AddCustomersHub', { spaceId })}
        />
        <DashboardActionRow
          icon={UtensilsCrossed}
          accent="#0F766E"
          title={t('dashboard.quickActions.setupPlanTodaysMenu')}
          subtitle={t('dashboard.quickActions.setupPlanTodaysMenuSubtitle')}
          onPress={() =>
            navigateFromTab('MenuPlanning', { spaceId, menuDate: todayIsoDate() })
          }
        />
        <DashboardActionRow
          icon={Share2}
          accent="#7C3AED"
          title={t('dashboard.quickActions.setupShareTodaysMenu')}
          subtitle={t('dashboard.quickActions.setupShareTodaysMenuSubtitle')}
          onPress={() =>
            navigateFromTab('MenuSharePreview', {
              spaceId,
              menuDate: todayIsoDate(),
            })
          }
        />
        {showPaymentsQuickAction ? (
          <DashboardActionRow
            icon={Wallet}
            accent="#D97706"
            title={t('dashboard.quickActions.setupConfigurePayments')}
            subtitle={t('dashboard.quickActions.setupConfigurePaymentsSubtitle')}
            onPress={handlePaymentsPress}
          />
        ) : null}
      </View>
    ) : null;

  const ownerQuickActions = visibility.showFullQuickActions
    ? fullQuickActions
    : messSetupQuickActions ??
      (pendingActionsCard ? (
        <View style={styles.quickStack}>{pendingActionsCard}</View>
      ) : null);

  const quickActions = showOwnerDashboard ? ownerQuickActions : fullQuickActions;

  const showInitialDashboardLoader =
    dashboard.loading &&
    dashboard.summary == null &&
    quickAccommodation.operations == null;

  const accommodationOpsReady =
    isMess ||
    !accommodationApplicable ||
    accommodationOperations != null ||
    (!quickAccommodation.loading && !showInitialDashboardLoader);

  /**
   * Single aggregate gate: never paint Hero / Health / Lifecycle / ops with
   * incomplete or previous-space values. Pull-to-refresh keeps content visible.
   */
  const ownerDashboardReady =
    !lifecycleLoading &&
    lifecycleContext != null &&
    evaluation != null &&
    !dashboard.loading &&
    accommodationOpsReady;

  const showOwnerDashboardBody = showOwnerDashboard && ownerDashboardReady;

  const showQuickSection = showOwnerDashboard
    ? showOwnerDashboardBody &&
      (quickActions != null ||
        (visibility.elevatePendingActions && pendingActionsCard != null))
    : quickActions != null || pendingActionsCard != null;

  const showSetupCard =
    showOwnerDashboardBody &&
    shouldShowSetupChrome(lifecycle) &&
    lifecycleProgress != null &&
    evaluation != null &&
    !lifecycleProgress.isRequiredComplete;

  const remainingRequiredSteps = lifecycleProgress
    ? Math.max(0, lifecycleProgress.requiredTotal - lifecycleProgress.requiredCompleted)
    : 0;

  const nextMessMilestoneId = evaluation?.recommendation?.milestoneId ?? null;

  const heroSubtitle = (() => {
    if (!showOwnerDashboardBody) {
      return undefined;
    }
    if (isMess) {
      if (lifecycle === 'READY') {
        return t('dashboard.owner.heroSubtitleMessReady');
      }
      if (!showSetupCard) {
        return undefined;
      }
      switch (nextMessMilestoneId) {
        case 'RESIDENTS_READY':
          return t('dashboard.owner.heroSubtitleMessLibraryDone');
        case 'TODAYS_MENU_READY':
          return t('dashboard.owner.heroSubtitleMessCustomersDone');
        case 'MENU_SHARED':
          return t('dashboard.owner.heroSubtitleMessMenuDone');
        case 'MEALS_READY':
        default:
          return t('dashboard.owner.heroSubtitleSetupMess', {
            count: remainingRequiredSteps,
          });
      }
    }
    return showSetupCard ? t('dashboard.owner.heroSubtitleSetup') : undefined;
  })();

  const showOpsBlock =
    showOwnerDashboardBody &&
    (visibility.showFinancial ||
      visibility.showAccommodationOps ||
      visibility.showMealOps);

  return (
    <Screen
      scrollable
      contentStyle={styles.content}
      refreshing={dashboard.refreshing}
      onRefresh={showOwnerDashboard ? handleDashboardRefresh : undefined}>
      {hierarchyPicker.pickerModal}
      {showOwnerDashboard && !ownerDashboardReady ? (
        <DashboardOwnerLoadingSkeleton
          showPropertyOps={!isMess && accommodationApplicable}
          showMealOps={showMealOperations}
        />
      ) : null}
      {showOwnerDashboardBody && spaceEntry ? (
        <DashboardOwnerHero
          spaceName={spaceEntry.spaceName}
          spaceTypeLabel={spaceType ? getSpaceTypeLabel(spaceType) : undefined}
          subtitle={heroSubtitle}
          health={health}
          onWelcomePress={
            spaceId
              ? () => navigateFromTab('SpaceDetails', { spaceId })
              : undefined
          }
          onHealthPress={
            spaceId && health
              ? () => navigateFromTab('DashboardSpaceHealth', { spaceId })
              : undefined
          }
        />
      ) : null}
      {spaceEntry && !showOwnerDashboard && !isMealParticipant ? (
        <View style={styles.spaceDetails}>
          <Text style={styles.spaceName}>{spaceEntry.spaceName}</Text>
          <Text style={styles.spaceType}>
            {spaceType ? formatSpaceType(spaceType) : ''}
          </Text>
        </View>
      ) : null}

      {isMealParticipant ? (
        <DashboardCustomerMealsSection spaceId={spaceId} showCustomerChrome />
      ) : null}

      {showOwnerDashboardBody ? (
        <>
          {showSetupCard && evaluation && lifecycleProgress ? (
            <CoachmarkSequence
              spaceId={spaceId}
              tourId="setup.mess.v1"
              lifecycle={lifecycle}
              enabled={
                ENABLE_SETUP_COACHMARKS &&
                isMess &&
                showOwnerDashboard &&
                showSetupCard
              }>
              <DashboardSetupProgressCard
                progress={lifecycleProgress}
                recommendation={nextRecommendedAction}
                milestones={evaluation.statuses}
                onContinue={handleSetupContinue}
                onStepPress={handleSetupStepPress}
                onSkipOptional={handleSkipOptionalSetup}
                dismissedOptionalIds={dismissedOptionalIds}
                spaceType={spaceType}
                enableCoachmarkAnchors={isMess}
              />
            </CoachmarkSequence>
          ) : null}

          {showOpsBlock ? (
            <>
              {visibility.showFinancial ? (
                <View
                  style={
                    visibility.softenFinancial ? styles.softenedOps : undefined
                  }>
                  <DashboardFinancialSnapshot
                    alwaysShow
                    loading={false}
                    financial={dashboard.financial}
                    emptyHint={
                      isMess && visibility.softenFinancial
                        ? t('dashboard.financial.emptyHintMess')
                        : undefined
                    }
                    onExpectedPress={
                      showPaymentsQuickAction
                        ? () => handlePaymentsNavigate('all')
                        : undefined
                    }
                    onCollectedPress={
                      showPaymentsQuickAction
                        ? () => handlePaymentsNavigate('collected')
                        : undefined
                    }
                    onUnderReviewPress={
                      showPaymentsQuickAction
                        ? () => handlePaymentsNavigate('underReview')
                        : undefined
                    }
                    onPendingPress={
                      showPaymentsQuickAction
                        ? () => handlePaymentsNavigate('pending')
                        : undefined
                    }
                  />
                </View>
              ) : null}

              {visibility.showAccommodationOps && !isMess && accommodationOperations ? (
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

              {visibility.showMealOps && showMealOperations ? (
                <DashboardMealOperations
                  spaceId={spaceId}
                  enabled={showMealOperations}
                  guidedEmpty={isMess && Boolean(showSetupCard)}
                />
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
  content: {
    // Override Screen's uniform 24dp padding for tighter AppBar → Hero (12dp).
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.section,
  },
  spaceDetails: { marginBottom: spacing.lg },
  spaceName: { ...typography.h2, marginBottom: spacing.xs },
  spaceType: { ...typography.body, color: colors.muted },
  quickSection: { marginBottom: spacing.lg },
  quickStack: {
    gap: spacing.sm,
  },
  softenedOps: {
    opacity: 0.72,
  },
  tenantHint: {
    ...typography.body,
    color: colors.muted,
  },
});
