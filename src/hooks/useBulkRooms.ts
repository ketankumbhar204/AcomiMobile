import { useCallback, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { BulkCreateRoomsRequest, BulkCreateRoomsResponse, UUID } from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import { devLog } from '../utils/devLog';

export function useBulkRooms() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkCreateUnderFloor = useCallback(
    async (
      spaceId: UUID,
      floorId: UUID,
      body: BulkCreateRoomsRequest,
    ): Promise<BulkCreateRoomsResponse | null> => {
      devLog('[useBulkRooms] floor', floorId, body);
      setLoading(true);
      setError(null);

      try {
        return await accommodationApi.bulkCreateRoomsUnderFloor(spaceId, floorId, body);
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.bulk.errors.rooms');
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const bulkCreateUnderUnit = useCallback(
    async (
      spaceId: UUID,
      unitId: UUID,
      body: BulkCreateRoomsRequest,
    ): Promise<BulkCreateRoomsResponse | null> => {
      devLog('[useBulkRooms] unit', unitId, body);
      setLoading(true);
      setError(null);

      try {
        return await accommodationApi.bulkCreateRoomsUnderUnit(spaceId, unitId, body);
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.bulk.errors.rooms');
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { bulkCreateUnderFloor, bulkCreateUnderUnit, loading, error, setError };
}
