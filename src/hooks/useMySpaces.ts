import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  spaceApi,
  userSpaceResponseToSpace,
} from '../api';
import type { Space } from '../api/types';
import { i18n } from '../i18n';
import { getAuthRequiredMessage, useAuthenticatedUserId } from './useAuth';

type UseMySpacesResult = {
  spaces: Space[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useMySpaces(): UseMySpacesResult {
  const userId = useAuthenticatedUserId();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpaces = useCallback(async () => {
    if (!userId) {
      setSpaces([]);
      setError(getAuthRequiredMessage());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await spaceApi.getUserSpaces(userId);
      setSpaces(response.map(userSpaceResponseToSpace));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : i18n.t('common.errors.loadSpaces');
      setError(message);
      setSpaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  return { spaces, isLoading, error, refetch: fetchSpaces };
}
