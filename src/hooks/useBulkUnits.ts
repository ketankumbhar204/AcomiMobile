import { useCallback, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { BulkCreateUnitsRequest, BulkCreateUnitsResponse, UUID } from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';

export function useBulkUnits() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkCreate = useCallback(
    async (
      spaceId: UUID,
      buildingId: UUID,
      body: BulkCreateUnitsRequest,
    ): Promise<BulkCreateUnitsResponse | null> => {
      console.log('[useBulkUnits]', buildingId, body);
      setLoading(true);
      setError(null);

      try {
        return await accommodationApi.bulkCreateUnits(spaceId, buildingId, body);
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.bulk.errors.units');
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
