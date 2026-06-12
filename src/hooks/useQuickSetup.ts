import { useCallback, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type {
  AccommodationSetupPreviewResponse,
  AccommodationSetupRequest,
  AccommodationSetupResultResponse,
  UUID,
} from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';

export function useQuickSetup(spaceId: UUID | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useCallback(
    async (body: AccommodationSetupRequest): Promise<AccommodationSetupPreviewResponse | null> => {
      if (!spaceId) {
        return null;
      }

      console.log('[useQuickSetup] preview');
      setLoading(true);
      setError(null);

      try {
        const data = await accommodationApi.previewSetup(spaceId, body);
        return data;
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.setup.errors.preview');
        console.error('[useQuickSetup] preview failed', err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  const execute = useCallback(
    async (
      body: AccommodationSetupRequest,
      idempotencyKey: string,
    ): Promise<AccommodationSetupResultResponse | null> => {
      if (!spaceId) {
        return null;
      }

      console.log('[useQuickSetup] execute', idempotencyKey);
      setLoading(true);
      setError(null);

      try {
        const data = await accommodationApi.executeSetup(spaceId, body, idempotencyKey);
        return data;
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.setup.errors.execute');
        console.error('[useQuickSetup] execute failed', err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  return { preview, execute, loading, error, setError };
}
