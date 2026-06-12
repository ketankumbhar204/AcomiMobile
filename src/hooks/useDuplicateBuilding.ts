import { useCallback, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { DuplicateBuildingRequest, DuplicateBuildingResponse, UUID } from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';

export function useDuplicateBuilding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = useCallback(
    async (
      spaceId: UUID,
      buildingId: UUID,
      body: DuplicateBuildingRequest,
    ): Promise<DuplicateBuildingResponse | null> => {
      console.log('[useDuplicateBuilding]', buildingId);
      setLoading(true);
      setError(null);

      try {
        return await accommodationApi.duplicateBuilding(spaceId, buildingId, body);
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.duplicate.errors.building');
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { duplicate, loading, error, setError };
}
