import { useCallback, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { DuplicateRoomRequest, DuplicateRoomResponse, UUID } from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';

export function useDuplicateRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = useCallback(
    async (
      spaceId: UUID,
      roomId: UUID,
      body: DuplicateRoomRequest,
    ): Promise<DuplicateRoomResponse | null> => {
      console.log('[useDuplicateRoom]', roomId);
      setLoading(true);
      setError(null);

      try {
        return await accommodationApi.duplicateRoom(spaceId, roomId, body);
      } catch (err) {
        const message = getAccommodationErrorMessage(err, 'accommodation.duplicate.errors.room');
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
