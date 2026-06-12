import { useCallback, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { BulkCreateBedsRequest, BulkCreateBedsResponse, UUID } from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';

export function useBulkBeds() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkCreate = useCallback(
    async (
      spaceId: UUID,
      roomId: UUID,
      body: BulkCreateBedsRequest,
    ): Promise<BulkCreateBedsResponse | null> => {
      console.log('[useBulkBeds]', roomId, body);
      setLoading(true);
      setError(null);

      try {
        return await accommodationApi.bulkCreateBeds(spaceId, roomId, body);
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.bulk.errors.beds');
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { bulkCreate, loading, error, setError };
}
