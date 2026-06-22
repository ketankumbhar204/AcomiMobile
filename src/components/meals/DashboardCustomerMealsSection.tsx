import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import {
  DashboardCustomerPollCard,
  type DashboardPollCardState,
} from './DashboardCustomerPollCard';
import { DashboardCustomerSubscriptionBanner } from './DashboardCustomerSubscriptionBanner';
import { MealPollPaymentProofModal } from './MealPollPaymentProofModal';

type MainStackNav = NativeStackNavigationProp<MainStackParamList>;

type DashboardCustomerMealsSectionProps = {
  spaceId: UUID;
};

function resolveCardState(
  loading: boolean,
  openPollCount: number,
  allResponded: boolean,
  hasPartialSubmission: boolean,
): DashboardPollCardState {
  if (!loading && openPollCount === 0) {
    return 'empty';
  }
  if (allResponded) {
    return 'complete';
  }
  if (hasPartialSubmission) {
    return 'partial';
  }
  return 'active';
}

export function DashboardCustomerMealsSection({ spaceId }: DashboardCustomerMealsSectionProps) {
  const { t, i18n } = useTranslation();
  const menuDate = tomorrowIsoDate();
  const permissions = useSpacePermissions(spaceId);
  const navigation = useNavigation();
  const stackNavigation =
    navigation.getParent<MainStackNav>() ?? (navigation as MainStackNav);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const { memberId: linkedMemberId } = useLinkedMember(spaceId);
  const { status: subscriptionStatus, reload: reloadSubscriptionStatus } =
    useCustomerSubscriptionStatus(spaceId);

  useFocusEffect(
    useCallback(() => {
      void reloadSubscriptionStatus();
    }, [reloadSubscriptionStatus]),
  );

  const poll = useMealPollDay(spaceId, menuDate, permissions.spaceType);

  const cardState = useMemo(
    () =>
      resolveCardState(
        poll.loading,
        poll.openPolls.length,
        poll.allResponded,
        poll.hasPartialSubmission,
      ),
    [poll.allResponded, poll.hasPartialSubmission, poll.loading, poll.openPolls.length],
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

  const handleOpenPoll = useCallback(() => {
    if (mealSelectionBlocked) {
      return;
    }
    if (poll.allResponded) {
      poll.handleUpdateChoices();
    }

    const params = { spaceId, menuDate };
    if (stackNavigation?.navigate) {
      stackNavigation.navigate('MealPollResponse', params);
      return;
    }

    navigateMainStack('MealPollResponse', params);
  }, [
    mealSelectionBlocked,
    menuDate,
    poll.allResponded,
    poll.handleUpdateChoices,
    spaceId,
    stackNavigation,
  ]);

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

  const handleProofSubmit = useCallback(
    async (proofImageBase64: string) => {
      const success = await poll.submitPaymentProof(proofImageBase64);
      if (success) {
        setProofModalOpen(false);
      }
    },
    [poll.submitPaymentProof],
  );

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
        openPolls={poll.openPolls}
        multiQuantity={poll.multiQuantity}
        cardState={cardState}
        paymentStatus={poll.myPaymentStatus}
        rejectionReason={poll.myRejectionReason}
        prepaidOverflowAmount={poll.myPrepaidOverflowAmount}
        prepaidDebitedAmount={poll.myPrepaidDebitedAmount}
        prepaidOverflowPayment={poll.myPrepaidOverflowPayment}
        onAction={cardState === 'empty' ? undefined : handleOpenPoll}
        actionDisabled={mealSelectionBlocked && cardState !== 'empty'}
        actionDisabledReason={mealSelectionDisabledReason}
        onUploadProof={
          poll.myPaymentStatus === 'PENDING' || poll.myPaymentStatus === 'REJECTED'
            ? () => setProofModalOpen(true)
            : undefined
        }
      />

      <MealPollPaymentProofModal
        visible={proofModalOpen}
        submitting={poll.saving}
        onClose={() => setProofModalOpen(false)}
        onSubmit={proof => void handleProofSubmit(proof)}
      />
    </>
  );
}
