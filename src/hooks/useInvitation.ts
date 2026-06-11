import { useCallback, useState } from 'react';
import { ApiError, memberApi } from '../api';
import type {
  CreateInvitationRequest,
  InvitationResponse,
  SpaceMembershipResponse,
  UUID,
} from '../api/types';
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
        return await memberApi.createInvitation({
          ...payload,
          invitedByUserId: userId,
        });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to send invitation. Please try again.';
        setError(message);
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
        return await memberApi.acceptInvitation(invitationId, { userId });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to accept invitation. Please try again.';
        setError(message);
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
