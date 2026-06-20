import React, { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UUID } from '../../api/types';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import {
  DashboardCustomerPollCard,
  type DashboardPollCardState,
} from './DashboardCustomerPollCard';
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
  const menuDate = tomorrowIsoDate();
  const permissions = useSpacePermissions(spaceId);
  const navigation = useNavigation();
  const stackNavigation =
    navigation.getParent<MainStackNav>() ?? (navigation as MainStackNav);
  const [proofModalOpen, setProofModalOpen] = useState(false);

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

  const handleOpenPoll = useCallback(() => {
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
    menuDate,
    poll.allResponded,
    poll.handleUpdateChoices,
    spaceId,
    stackNavigation,
  ]);

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
      <DashboardCustomerPollCard
        menuDate={menuDate}
        loading={poll.loading}
        openPolls={poll.openPolls}
        multiQuantity={poll.multiQuantity}
        cardState={cardState}
        paymentStatus={poll.myPaymentStatus}
        rejectionReason={poll.myRejectionReason}
        onAction={cardState === 'empty' ? undefined : handleOpenPoll}
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
