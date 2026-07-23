import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { formatSpaceType } from '../../api';
import type { MealPollPaymentStatus, UUID } from '../../api/types';
import { DashboardCustomerHero } from '../dashboard/customer/DashboardCustomerHero';
import { DashboardCustomerQuickActions } from '../dashboard/customer/DashboardCustomerQuickActions';
import { DashboardCustomerQuickStats } from '../dashboard/customer/DashboardCustomerQuickStats';
import { DashboardCustomerRecentOrders } from '../dashboard/customer/DashboardCustomerRecentOrders';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import { useMemberMealActivity } from '../../hooks/useMemberMealActivity';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import {
  canShiftCustomerMealDate,
  customerMealDateBounds,
  resolveCustomerMealFocusDate,
} from '../../utils/customerMealFocusDate';
import {
  buildRecentOrdersFromActivity,
  countMenuItemsFromPolls,
  countUpcomingPayments,
} from '../../utils/customerDashboardStats';
import { addDaysIsoDate, isPastMenuDate, todayIsoDate } from '../../utils/mealDates';
import { buildMealSummaryFromPolls } from '../../utils/mealSelectionSummary';
import { findMySpaceEntry } from '../../utils/spacePermissions';
import {
  DashboardCustomerPollCard,
  type DashboardPollCardState,
} from './DashboardCustomerPollCard';
import { DashboardCustomerSubscriptionBanner } from './DashboardCustomerSubscriptionBanner';
import { MenuDatePickerModal } from './MenuDatePickerModal';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type DashboardCustomerMealsSectionProps = {
  spaceId: UUID;
  /** When true, Design A quick actions replace the dashboard "My payments" card. */
  showCustomerChrome?: boolean;
};

function resolveCardState(
  loading: boolean,
  pollCount: number,
  allResponded: boolean,
  hasPartialSubmission: boolean,
  /** When the day has a meal payment, treat it as ordered even if poll flags lag. */
  hasPaymentContext = false,
  hasOrderPlates = false,
): DashboardPollCardState {
  if (!loading && pollCount === 0) {
    return 'empty';
  }
  if (allResponded || (hasPaymentContext && !hasPartialSubmission && hasOrderPlates)) {
    return 'complete';
  }
  if (hasPartialSubmission || hasOrderPlates) {
    return 'partial';
  }
  // Payment exists for this day (e.g. Pay later) — keep order/payment UI visible.
  if (hasPaymentContext) {
    return 'complete';
  }
  return 'active';
}

function canUploadMealPaymentProof(status: MealPollPaymentStatus | null | undefined): boolean {
  return (
    status === 'PENDING' ||
    status === 'REJECTED' ||
    // Backend may surface owner "needs update" on meal-day payments.
    (status as string) === 'UPDATE_REQUESTED'
  );
}

export function DashboardCustomerMealsSection({
  spaceId,
  showCustomerChrome = true,
}: DashboardCustomerMealsSectionProps) {
  const { t, i18n } = useTranslation();
  const [menuDate, setMenuDate] = useState(todayIsoDate);
  const [userPickedDate, setUserPickedDate] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const mealPricing = useMealPricingPolicy(spaceId);
  const permissions = useSpacePermissions(spaceId);
  const navigation = useNavigation<Nav>();
  const stackNavigation =
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>() ??
    (navigation as unknown as NativeStackNavigationProp<MainStackParamList>);
  const showToast = useToastStore(state => state.showToast);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceEntry = findMySpaceEntry(mySpaces, spaceId);
  const { memberId: linkedMemberId, member: linkedMember } = useLinkedMember(spaceId);
  const { status: subscriptionStatus, reload: reloadSubscriptionStatus } =
    useCustomerSubscriptionStatus(spaceId);
  const activity = useMemberMealActivity(
    spaceId,
    linkedMemberId ?? spaceId,
    linkedMemberId != null,
  );

  useFocusEffect(
    useCallback(() => {
      void reloadSubscriptionStatus();
    }, [reloadSubscriptionStatus]),
  );

  useFocusEffect(
    useCallback(() => {
      if (userPickedDate) {
        return;
      }
      let cancelled = false;
      void resolveCustomerMealFocusDate(spaceId, permissions.spaceType).then(date => {
        if (!cancelled) {
          setMenuDate(date);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [permissions.spaceType, spaceId, userPickedDate]),
  );

  useFocusEffect(
    useCallback(() => {
      if (linkedMemberId) {
        void activity.reload();
      }
    }, [activity.reload, linkedMemberId]),
  );

  const poll = useMealPollDay(spaceId, menuDate, permissions.spaceType);
  const isPastDate = isPastMenuDate(menuDate);
  /** Today with only closed polls — still show menus, but as view-only. */
  const reviewOnly =
    isPastDate || (!poll.loading && poll.openPolls.length === 0 && poll.displayPolls.length > 0);

  const orderSummary = useMemo(
    () => buildMealSummaryFromPolls(poll.displayPolls, poll.multiQuantity),
    [poll.displayPolls, poll.multiQuantity],
  );

  const cardState = useMemo(
    () =>
      resolveCardState(
        poll.loading,
        poll.displayPolls.length,
        poll.allResponded,
        poll.hasPartialSubmission,
        poll.myPaymentStatus != null,
        orderSummary.totalPlates > 0,
      ),
    [
      orderSummary.totalPlates,
      poll.allResponded,
      poll.displayPolls.length,
      poll.hasPartialSubmission,
      poll.loading,
      poll.myPaymentStatus,
    ],
  );

  const totalMenuItems = useMemo(
    () => countMenuItemsFromPolls(poll.displayPolls),
    [poll.displayPolls],
  );

  const recentOrders = useMemo(
    () => buildRecentOrdersFromActivity(activity.activity, 4),
    [activity.activity],
  );

  const dueAmount = useMemo(() => {
    const pending = activity.activity?.summary?.pendingAmount;
    if (pending != null && Number(pending) > 0) {
      return Number(pending);
    }
    if (
      poll.myPaymentStatus === 'PENDING' ||
      poll.myPaymentStatus === 'REJECTED' ||
      (poll.myPaymentStatus as string) === 'UPDATE_REQUESTED'
    ) {
      if (poll.myPaymentChargedAmount != null) {
        return Number(poll.myPaymentChargedAmount);
      }
      return orderSummary.totalAmount > 0 ? orderSummary.totalAmount : null;
    }
    return null;
  }, [
    activity.activity?.summary?.pendingAmount,
    orderSummary.totalAmount,
    poll.myPaymentChargedAmount,
    poll.myPaymentStatus,
  ]);

  const upcomingPayments = useMemo(() => {
    const fromActivity = countUpcomingPayments(activity.activity);
    if (fromActivity > 0) {
      return fromActivity;
    }
    return canUploadMealPaymentProof(poll.myPaymentStatus) ? 1 : 0;
  }, [activity.activity, poll.myPaymentStatus]);

  const yourOrders = useMemo(() => {
    const accepted = activity.activity?.summary?.acceptedMeals;
    if (accepted != null) {
      return accepted;
    }
    return orderSummary.totalPlates;
  }, [activity.activity?.summary?.acceptedMeals, orderSummary.totalPlates]);

  const mealSelectionBlocked = useMemo(() => {
    if (!subscriptionStatus?.prepaidBilling) {
      return false;
    }
    if (subscriptionStatus.pendingActivationStatus === 'PENDING') {
      return true;
    }
    return !subscriptionStatus.subscriptionActive;
  }, [subscriptionStatus]);

  const mealSelectionDisabledReason = useMemo(() => {
    if (!mealSelectionBlocked || !subscriptionStatus?.prepaidBilling) {
      return undefined;
    }
    if (subscriptionStatus.pendingActivationStatus === 'PENDING') {
      return t('meals.subscription.customer.selectionPendingHint');
    }
    return t('meals.subscription.customer.selectionRequiredHint');
  }, [mealSelectionBlocked, subscriptionStatus, t]);

  const handlePreviousDate = useCallback(() => {
    if (!canShiftCustomerMealDate(menuDate, -1)) {
      return;
    }
    setUserPickedDate(true);
    setMenuDate(prev => addDaysIsoDate(prev, -1));
  }, [menuDate]);

  const handleNextDate = useCallback(() => {
    if (!canShiftCustomerMealDate(menuDate, 1)) {
      return;
    }
    setUserPickedDate(true);
    setMenuDate(prev => addDaysIsoDate(prev, 1));
  }, [menuDate]);

  const handlePickDate = useCallback((nextDate: string) => {
    const { minDate, maxDate } = customerMealDateBounds();
    if (nextDate < minDate || nextDate > maxDate) {
      return;
    }
    setUserPickedDate(true);
    setMenuDate(nextDate);
  }, []);

  const handleOpenPoll = useCallback(
    (date = menuDate) => {
      // Past / closed-only days are view-only; still allow opening to review menus/orders.
      if (mealSelectionBlocked && !reviewOnly && date === menuDate) {
        return;
      }

      const params = { spaceId, menuDate: date };
      if (stackNavigation?.navigate) {
        stackNavigation.navigate('MealPollResponse', params);
        return;
      }

      navigateMainStack('MealPollResponse', params);
    },
    [mealSelectionBlocked, menuDate, reviewOnly, spaceId, stackNavigation],
  );

  const handleViewPlans = useCallback(() => {
    if (!linkedMemberId) {
      return;
    }
    const params = { spaceId, memberId: linkedMemberId };
    if (stackNavigation?.navigate) {
      stackNavigation.navigate('CustomerSubscriptionPlans', params);
      return;
    }
    navigateMainStack('CustomerSubscriptionPlans', params);
  }, [linkedMemberId, spaceId, stackNavigation]);

  const handleUploadProof = useCallback(() => {
    if (!linkedMemberId) {
      showToast(t('paymentCollection.errors.submitProof'));
      return;
    }

    const summary = buildMealSummaryFromPolls(poll.displayPolls, poll.multiQuantity);
    const totalAmount =
      poll.myPaymentChargedAmount != null
        ? Number(poll.myPaymentChargedAmount)
        : summary.totalAmount;
    const currencyCode = summary.currencyCode || 'INR';
    const params: MainStackParamList['DayMealBulkPay'] = {
      spaceId,
      memberId: linkedMemberId,
      dates: [menuDate],
      totalAmount,
      currencyCode,
      memberName: linkedMember?.fullName ?? undefined,
    };

    if (stackNavigation?.navigate) {
      stackNavigation.navigate('DayMealBulkPay', params);
      return;
    }
    navigateMainStack('DayMealBulkPay', params);
  }, [
    linkedMember?.fullName,
    linkedMemberId,
    menuDate,
    poll.displayPolls,
    poll.multiQuantity,
    poll.myPaymentChargedAmount,
    showToast,
    spaceId,
    stackNavigation,
    t,
  ]);

  const handleMyOrders = useCallback(() => {
    navigation.navigate('Meals', { spaceId });
  }, [navigation, spaceId]);

  const handlePayments = useCallback(() => {
    if (!linkedMemberId || !linkedMember) {
      navigation.navigate('Payments', { spaceId });
      return;
    }
    const params = {
      spaceId,
      memberId: linkedMemberId,
      memberName: linkedMember.fullName,
    };
    if (stackNavigation?.navigate) {
      stackNavigation.navigate('MemberPayments', params);
      return;
    }
    navigateMainStack('MemberPayments', params);
  }, [linkedMember, linkedMemberId, navigation, spaceId, stackNavigation]);

  const handleComplaints = useCallback(() => {
    navigation.navigate('Complaints', { spaceId });
  }, [navigation, spaceId]);

  return (
    <>
      {showCustomerChrome && spaceEntry ? (
        <DashboardCustomerHero
          spaceName={spaceEntry.spaceName}
          spaceTypeLabel={
            permissions.spaceType ? formatSpaceType(permissions.spaceType) : undefined
          }
        />
      ) : null}

      {subscriptionStatus?.prepaidBilling ? (
        <DashboardCustomerSubscriptionBanner
          status={subscriptionStatus}
          locale={i18n.language}
          onViewPlans={handleViewPlans}
        />
      ) : null}

      <DashboardCustomerPollCard
        menuDate={menuDate}
        loading={poll.loading}
        openPolls={poll.displayPolls}
        multiQuantity={poll.multiQuantity}
        cardState={cardState}
        isPastDate={reviewOnly}
        paymentStatus={poll.myPaymentStatus}
        rejectionReason={poll.myRejectionReason}
        prepaidOverflowAmount={poll.myPrepaidOverflowAmount}
        prepaidDebitedAmount={poll.myPrepaidDebitedAmount}
        prepaidOverflowPayment={poll.myPrepaidOverflowPayment}
        onPreviousDate={handlePreviousDate}
        onNextDate={handleNextDate}
        canGoPrevious={canShiftCustomerMealDate(menuDate, -1)}
        canGoNext={canShiftCustomerMealDate(menuDate, 1)}
        onOpenCalendar={() => setDatePickerOpen(true)}
        onAction={cardState === 'empty' ? undefined : () => handleOpenPoll()}
        actionDisabled={mealSelectionBlocked && !reviewOnly && cardState !== 'empty'}
        actionDisabledReason={reviewOnly ? undefined : mealSelectionDisabledReason}
        showMealPrices={mealPricing.showMealPrices}
        onUploadProof={
          canUploadMealPaymentProof(poll.myPaymentStatus) ? handleUploadProof : undefined
        }
      />

      {showCustomerChrome ? (
        <>
          <DashboardCustomerQuickStats
            totalMenuItems={totalMenuItems}
            yourOrders={yourOrders}
            dueAmount={dueAmount}
            currencyCode={
              activity.activity?.summary?.currencyCode || orderSummary.currencyCode || 'INR'
            }
            upcomingPayments={upcomingPayments}
            loading={poll.loading && activity.loading}
          />

          <DashboardCustomerRecentOrders
            orders={recentOrders}
            loading={activity.loading}
            onPressOrder={date => handleOpenPoll(date)}
            onViewAll={handleMyOrders}
          />

          <DashboardCustomerQuickActions
            onOrders={handleMyOrders}
            onPayments={handlePayments}
            onComplaints={handleComplaints}
          />
        </>
      ) : null}

      <MenuDatePickerModal
        visible={datePickerOpen}
        value={menuDate}
        allowPastDates
        onClose={() => setDatePickerOpen(false)}
        onConfirm={handlePickDate}
      />
    </>
  );
}
