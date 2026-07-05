import { useCallback, useEffect, useRef, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { BuildingResponse, UUID } from '../api/types';
import {
  accommodationQueryKeys,
  getAccommodationInvalidationGeneration,
  queryKeyLabel,
  subscribeAccommodationInvalidation,
} from '../utils/accommodationQueryCache';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import {
  accommodationInactiveScopeKey,
  mergeInactiveListItems,
} from '../utils/accommodationInactiveRegistry';

export function useBuildings(spaceId: UUID | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const [cacheGeneration, setCacheGeneration] = useState(
    getAccommodationInvalidationGeneration(),
  );

  useEffect(() => {
    return subscribeAccommodationInvalidation(() => {
      setCacheGeneration(getAccommodationInvalidationGeneration());
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!spaceId || !enabled) {
      setBuildings([]);
      return;
    }

    const seq = ++requestSeq.current;
    const queryKey = accommodationQueryKeys.buildings(spaceId);
    console.log('[useBuildings] queryKey', queryKeyLabel(queryKey));

    setLoading(true);
    setError(null);

    try {
      const data = await accommodationApi.getBuildings(spaceId);
      if (seq !== requestSeq.current) {
        console.log('[useBuildings] stale response ignored', { spaceId });
        return;
      }
      const scopeKey = accommodationInactiveScopeKey('building', { spaceId });
      const merged = mergeInactiveListItems(
        data.map(building => ({ ...building, active: building.active ?? true })),
        scopeKey,
        building => building.buildingId,
      );
      setBuildings(merged);
      console.log('[useBuildings] loaded', merged.length);
    } catch (err) {
      if (seq !== requestSeq.current) {
        return;
      }
      const message = getAccommodationErrorMessage(err, 'accommodation.errors.loadBuildings');
      console.error('[useBuildings] failed', err);
      setError(message);
      setBuildings([]);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [enabled, spaceId]);

  const patchBuilding = useCallback(
    (buildingId: UUID, patch: Partial<BuildingResponse>) => {
      setBuildings(prev =>
        prev.map(building =>
          building.buildingId === buildingId ? { ...building, ...patch } : building,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    requestSeq.current += 1;
    if (!enabled || !spaceId) {
      setBuildings([]);
      setLoading(false);
      return;
    }
    void refresh();
  }, [cacheGeneration, enabled, refresh, spaceId]);

  const removeBuilding = useCallback((buildingId: UUID) => {
    setBuildings(prev => prev.filter(building => building.buildingId !== buildingId));
  }, []);

  return { buildings, loading, error, refresh, patchBuilding, removeBuilding };
}
