import { useCallback, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { DuplicateFloorRequest, DuplicateFloorResponse, UUID } from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import { devLog } from '../utils/devLog';

export function useDuplicateFloor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = useCallback(
    async (
      spaceId: UUID,
      buildingId: UUID,
      floorId: UUID,
      body: DuplicateFloorRequest,
    ): Promise<DuplicateFloorResponse | null> => {
      devLog('[useDuplicateFloor]', floorId);
      setLoading(true);
      setError(null);

      try {
        return await accommodationApi.duplicateFloor(spaceId, buildingId, floorId, body);
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.duplicate.errors.floor');
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
