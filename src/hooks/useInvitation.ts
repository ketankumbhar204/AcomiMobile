import { useCallback, useState } from 'react';
import { memberApi } from '../api';
import type {
  CreateInvitationRequest,
  InvitationResponse,
  SpaceMembershipResponse,
  UUID,
} from '../api/types';
import { getMembershipErrorMessage } from '../utils/membershipErrors';
import { invalidateDashboardQueries } from '../utils/dashboardQueryCache';
import { getAuthRequiredMessage, useAuthenticatedUserId } from './useAuth';

export type CreateInvitationInput = Omit<
  CreateInvitationRequest,
  'invitedByUserId'
>;

type UseCreateInvitationResult = {
  createInvitation: (
    payload: CreateInvitationInput,
  ) => Promise<InvitationResponse | null>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
};

export function useCreateInvitation(): UseCreateInvitationResult {
  const userId = useAuthenticatedUserId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvitation = useCallback(
    async (payload: CreateInvitationInput) => {
      if (!userId) {
        setError(getAuthRequiredMessage());
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const created = await memberApi.createInvitation({
          ...payload,
          invitedByUserId: userId,
        });
        invalidateDashboardQueries();
        return created;
      } catch (err) {
        setError(getMembershipErrorMessage(err, 'membership.errors.invite'));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { createInvitation, isSubmitting, error, clearError };
}

type UseAcceptInvitationResult = {
  acceptInvitation: (invitationId: UUID) => Promise<SpaceMembershipResponse | null>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
};

export function useAcceptInvitation(): UseAcceptInvitationResult {
  const userId = useAuthenticatedUserId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = useCallback(
    async (invitationId: UUID) => {
      if (!userId) {
        setError(getAuthRequiredMessage());
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const membership = await memberApi.acceptInvitation(invitationId, { userId });
        invalidateDashboardQueries();
        return membership;
      } catch (err) {
        setError(getMembershipErrorMessage(err, 'membership.errors.accept'));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { acceptInvitation, isSubmitting, error, clearError };
}
