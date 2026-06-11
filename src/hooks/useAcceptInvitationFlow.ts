import { useCallback, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type { SpaceMembershipResponse, UUID } from '../api/types';
import { resetToDashboard } from '../navigation/navigationRef';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { getMembershipErrorMessage } from '../utils/membershipErrors';

const LOG_TAG = '[AcceptInvitation]';

type UseAcceptInvitationFlowResult = {
  acceptInvitation: (invitationId: UUID) => Promise<SpaceMembershipResponse | null>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
};

export function useAcceptInvitationFlow(): UseAcceptInvitationFlowResult {
  const userId = useAuthStore(state => state.userId);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = useCallback(
    async (invitationId: UUID) => {
      if (!userId) {
        setError(getMembershipErrorMessage(null, 'common.errors.authRequired'));
        return null;
      }

      console.log(`${LOG_TAG} started`, invitationId);
      setIsSubmitting(true);
      setError(null);

      try {
        const membership = await memberApi.acceptInvitation(invitationId, {
          userId,
        });
        console.log(`${LOG_TAG} success`, membership.spaceId);

        await loadMySpaces();
        await switchSpace(membership.spaceId);
        resetToDashboard(membership.spaceId);

        return membership;
      } catch (err) {
        const message = getMembershipErrorMessage(err, 'membership.errors.accept');
        console.error(`${LOG_TAG} failed`, err);
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadMySpaces, switchSpace, userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { acceptInvitation, isSubmitting, error, clearError };
}
