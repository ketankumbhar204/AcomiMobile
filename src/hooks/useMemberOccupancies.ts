import { useCallback, useEffect, useRef, useState } from 'react';
import { occupancyApi } from '../api/occupancyApi';
import type { MemberOccupancyListResponse, UUID } from '../api/types';
import { getOccupancyErrorMessage } from '../utils/occupancyErrors';
import {
  getOccupancyInvalidationGeneration,
  occupancyKeys,
  subscribeOccupancyInvalidation,
} from '../utils/occupancyQueryCache';

export function useMemberOccupancies(
  spaceId: UUID | null,
  memberId: UUID | null,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<MemberOccupancyListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const [cacheGeneration, setCacheGeneration] = useState(
    getOccupancyInvalidationGeneration(),
  );

  useEffect(() => {
    return subscribeOccupancyInvalidation(() => {
      setCacheGeneration(getOccupancyInvalidationGeneration());
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!spaceId || !memberId || !enabled) {
      setData(null);
      return null;
    }

    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);

    try {
      const result = await occupancyApi.getMemberOccupancies(spaceId, memberId);
      if (seq !== requestSeq.current) {
        return null;
      }
      setData(result);
      return result;
    } catch (err) {
      if (seq !== requestSeq.current) {
        return null;
      }
      setError(getOccupancyErrorMessage(err, 'occupancy.errors.loadMember'));
      setData(null);
      return null;
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [enabled, memberId, spaceId]);

  useEffect(() => {
    requestSeq.current += 1;
    if (!enabled || !spaceId || !memberId) {
      setData(null);
      setLoading(false);
      return;
    }
    void refresh();
  }, [cacheGeneration, enabled, memberId, refresh, spaceId]);

  return { data, loading, error, refresh, queryKey: occupancyKeys.member(spaceId ?? '', memberId ?? '') };
}
