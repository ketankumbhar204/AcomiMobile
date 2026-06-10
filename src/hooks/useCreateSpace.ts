import { useCallback, useState } from 'react';
import { ApiError, spaceApi, spaceResponseToSpace } from '../api';
import { i18n } from '../i18n';
import type { CreateSpaceRequest, Space } from '../api/types';
import { getAuthRequiredMessage, useAuthenticatedUserId } from './useAuth';

export type CreateSpaceInput = Omit<CreateSpaceRequest, 'ownerId'>;

type UseCreateSpaceResult = {
  createSpace: (payload: CreateSpaceInput) => Promise<Space | null>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
};

export function useCreateSpace(): UseCreateSpaceResult {
  const userId = useAuthenticatedUserId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSpace = useCallback(
    async (payload: CreateSpaceInput) => {
      if (!userId) {
        setError(getAuthRequiredMessage());
        return null;
      }

      console.log('[CreateSpace] Request Started', { ...payload, ownerId: userId });

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await spaceApi.create({
          ...payload,
          ownerId: userId,
        });

        console.log('[CreateSpace] API Response', response);

        const space = spaceResponseToSpace(response);

        console.log('[CreateSpace] Mapped Space', space);

        return space;
      } catch (err) {
        console.error('[CreateSpace] Error', err);

        const message =
          err instanceof ApiError
            ? err.message
            : i18n.t('common.errors.createSpace');

        console.error('[CreateSpace] Error Message', message);

        setError(message);
        return null;
      } finally {
        console.log('[CreateSpace] Request Finished');

        setIsSubmitting(false);
      }
    },
    [userId],
  );

  const clearError = useCallback(() => {
    console.log('[CreateSpace] Clearing Error');
    setError(null);
  }, []);

  return { createSpace, isSubmitting, error, clearError };
}
