import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { occupancyApi } from '../api/occupancyApi';
import type { OccupancyResponse, OccupancyStatus, UUID } from '../api/types';
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

async function fetchOccupancyForTarget(
  spaceId: UUID,
  target: TargetOccupancyFilter,
  status: OccupancyStatus,
): Promise<OccupancyResponse | null> {
  const page = await occupancyApi.listOccupancies(spaceId, {
    status,
    bedId: target.bedId,
    roomId: target.roomId,
    unitId: target.unitId,
    size: 1,
  });
  return page.content[0] ?? null;
}

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
  const targetFilter = useMemo(
    () => ({
      bedId: target.bedId,
      roomId: target.roomId,
      unitId: target.unitId,
    }),
    [target.bedId, target.roomId, target.unitId],
  );

  useEffect(() => {
    return subscribeOccupancyInvalidation(() => {
      setCacheGeneration(getOccupancyInvalidationGeneration());
    });
  }, []);

  const refresh = useCallback(async () => {
    const hasTarget = Boolean(
      targetFilter.bedId || targetFilter.roomId || targetFilter.unitId,
    );
    if (!spaceId || !hasTarget || !enabled) {
      setOccupancy(null);
      return null;
    }

    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);

    try {
      const active = await fetchOccupancyForTarget(spaceId, targetFilter, 'ACTIVE');
      if (seq !== requestSeq.current) {
        return null;
      }
      if (active) {
        setOccupancy(active);
        return active;
      }

      const reserved = await fetchOccupancyForTarget(spaceId, targetFilter, 'RESERVED');
      if (seq !== requestSeq.current) {
        return null;
      }
      setOccupancy(reserved);
      return reserved;
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
  }, [enabled, spaceId, targetFilter]);

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
    queryKey: occupancyKeys.list(spaceId ?? '', target),
  };
}
