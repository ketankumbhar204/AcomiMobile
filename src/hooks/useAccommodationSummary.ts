import { useCallback, useEffect, useRef, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { BuildingSummaryResponse, UUID } from '../api/types';
import {
  accommodationQueryKeys,
  getAccommodationInvalidationGeneration,
  queryKeyLabel,
  subscribeAccommodationInvalidation,
} from '../utils/accommodationQueryCache';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import { devLog } from '../utils/devLog';

export function useAccommodationSummary(spaceId: UUID | null, buildingId: UUID | null) {
  const [summary, setSummary] = useState<BuildingSummaryResponse | null>(null);
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
    if (!spaceId || !buildingId) {
      return null;
    }

    const seq = ++requestSeq.current;
    const queryKey = accommodationQueryKeys.buildingSummary(spaceId, buildingId);
    devLog('[useAccommodationSummary] queryKey', queryKeyLabel(queryKey));

    setLoading(true);
    setError(null);

    try {
      const data = await accommodationApi.getBuildingSummary(spaceId, buildingId);
      if (seq !== requestSeq.current) {
        return null;
      }
      setSummary(data);
      return data;
    } catch (err) {
      if (seq !== requestSeq.current) {
        return null;
      }
      const message = getAccommodationErrorMessage(
        err,
        'accommodation.errors.loadSummary',
      );
      console.error('[useAccommodationSummary] failed', err);
      setError(message);
      return null;
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [buildingId, spaceId]);

  const patchSummary = useCallback((patch: Partial<BuildingSummaryResponse>) => {
    setSummary(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);

  useEffect(() => {
    requestSeq.current += 1;
    if (!spaceId || !buildingId) {
      setSummary(null);
      return;
    }
    void refresh();
  }, [buildingId, cacheGeneration, refresh, spaceId]);

  return { summary, loading, error, refresh, patchSummary };
}
