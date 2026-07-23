import { useCallback, useRef, useState } from 'react';
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
  const inFlightRef = useRef(false);

  const createSpace = useCallback(
    async (payload: CreateSpaceInput) => {
      if (!userId) {
        setError(getAuthRequiredMessage());
        return null;
      }

      // Hard guard against rapid taps before React re-renders disabled state.
      if (inFlightRef.current) {
        return null;
      }

      inFlightRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await spaceApi.createSpace({
          ...payload,
          ownerId: userId,
        });

        const space = spaceResponseToSpace(response);
        if (!space?.id) {
          setError(i18n.t('common.errors.createSpace'));
          return null;
        }

        return space;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : i18n.t('common.errors.createSpace');
        setError(message);
        return null;
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [userId],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { createSpace, isSubmitting, error, clearError };
}
