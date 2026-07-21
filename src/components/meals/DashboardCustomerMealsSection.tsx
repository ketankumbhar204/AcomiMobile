import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MealPollPaymentStatus, UUID } from '../../api/types';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useToastStore } from '../../store/toastStore';
import {
  canShiftCustomerMealDate,
  customerMealDateBounds,
  resolveCustomerMealFocusDate,
} from '../../utils/customerMealFocusDate';
import { addDaysIsoDate, isPastMenuDate, todayIsoDate } from '../../utils/mealDates';
import { buildMealSummaryFromPolls } from '../../utils/mealSelectionSummary';
import {
  DashboardCustomerPollCard,
  type DashboardPollCardState,
} from './DashboardCustomerPollCard';
import { DashboardCustomerSubscriptionBanner } from './DashboardCustomerSubscriptionBanner';
import { MenuDatePickerModal } from './MenuDatePickerModal';

type MainStackNav = NativeStackNavigationProp<MainStackParamList>;

type DashboardCustomerMealsSectionProps = {
  spaceId: UUID;
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

export function DashboardCustomerMealsSection({ spaceId }: DashboardCustomerMealsSectionProps) {
  const { t, i18n } = useTranslation();
  const [menuDate, setMenuDate] = useState(todayIsoDate);
  const [userPickedDate, setUserPickedDate] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const mealPricing = useMealPricingPolicy(spaceId);
  const permissions = useSpacePermissions(spaceId);
  const navigation = useNavigation();
  const stackNavigation =
    navigation.getParent<MainStackNav>() ?? (navigation as MainStackNav);
  const showToast = useToastStore(state => state.showToast);
  const { memberId: linkedMemberId, member: linkedMember } = useLinkedMember(spaceId);
  const { status: subscriptionStatus, reload: reloadSubscriptionStatus } =
    useCustomerSubscriptionStatus(spaceId);

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

  const handleOpenPoll = useCallback(() => {
    // Past / closed-only days are view-only; still allow opening to review menus/orders.
    if (mealSelectionBlocked && !reviewOnly) {
      return;
    }

    const params = { spaceId, menuDate };
    if (stackNavigation?.navigate) {
      stackNavigation.navigate('MealPollResponse', params);
      return;
    }

    navigateMainStack('MealPollResponse', params);
  }, [mealSelectionBlocked, menuDate, reviewOnly, spaceId, stackNavigation]);

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

  return (
    <>
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
        onAction={cardState === 'empty' ? undefined : handleOpenPoll}
        actionDisabled={mealSelectionBlocked && !reviewOnly && cardState !== 'empty'}
        actionDisabledReason={reviewOnly ? undefined : mealSelectionDisabledReason}
        showMealPrices={mealPricing.showMealPrices}
        onUploadProof={
          canUploadMealPaymentProof(poll.myPaymentStatus) ? handleUploadProof : undefined
        }
      />

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
