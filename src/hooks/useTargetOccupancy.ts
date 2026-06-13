import { useCallback, useEffect, useRef, useState } from 'react';
import { occupancyApi } from '../api/occupancyApi';
import type { OccupancyResponse, UUID } from '../api/types';
import { getOccupancyErrorMessage } from '../utils/occupancyErrors';
import {
  getOccupancyInvalidationGeneration,
  occupancyKeys,
  subscribeOccupancyInvalidation,
} from '../utils/occupancyQueryCache';

export type TargetOccupancyFilter = {
  bedId?: UUID;
  roomId?: UUID;
  unitId?: UUID;
};

export function useTargetOccupancy(
  spaceId: UUID | null,
  target: TargetOccupancyFilter,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const [cacheGeneration, setCacheGeneration] = useState(
    getOccupancyInvalidationGeneration(),
  );

  const targetKey = target.bedId ?? target.roomId ?? target.unitId ?? '';

  useEffect(() => {
    return subscribeOccupancyInvalidation(() => {
      setCacheGeneration(getOccupancyInvalidationGeneration());
    });
  }, []);

  const refresh = useCallback(async () => {
    const hasTarget = Boolean(target.bedId || target.roomId || target.unitId);
    if (!spaceId || !hasTarget || !enabled) {
      setOccupancy(null);
      return null;
    }

    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);

    try {
      const page = await occupancyApi.listOccupancies(spaceId, {
        status: 'ACTIVE',
        bedId: target.bedId,
        roomId: target.roomId,
        unitId: target.unitId,
        size: 1,
      });
      if (seq !== requestSeq.current) {
        return null;
      }
      const active = page.content[0] ?? null;
      setOccupancy(active);
      return active;
    } catch (err) {
      if (seq !== requestSeq.current) {
        return null;
      }
      setOccupancy(null);
      setError(getOccupancyErrorMessage(err, 'occupancy.errors.loadTarget'));
      return null;
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [enabled, spaceId, target.bedId, target.roomId, target.unitId]);

  useEffect(() => {
    requestSeq.current += 1;
    if (!enabled || !spaceId || !targetKey) {
      setOccupancy(null);
      setLoading(false);
      return;
    }
    void refresh();
  }, [cacheGeneration, enabled, refresh, spaceId, targetKey]);

  return {
    occupancy,
    loading,
    error,
    refresh,
    queryKey: occupancyKeys.list(spaceId ?? '', {
      status: 'ACTIVE',
      ...target,
    }),
  };
}
