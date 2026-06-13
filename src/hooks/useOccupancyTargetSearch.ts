import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpaceType } from '../api/types';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import {
  searchOccupancyTargets,
  type OccupancySearchResult,
} from '../utils/occupancyTargetSearch';

const SEARCH_DEBOUNCE_MS = 350;

export function useOccupancyTargetSearch(
  spaceId: string | null,
  spaceType: SpaceType | null,
  query: string,
  enabled: boolean,
) {
  const [results, setResults] = useState<OccupancySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!enabled || !spaceId || !spaceType || trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);

    try {
      const data = await searchOccupancyTargets(spaceId, spaceType, trimmed);
      if (seq !== requestSeq.current) {
        return;
      }
      setResults(data);
    } catch (err) {
      if (seq !== requestSeq.current) {
        return;
      }
      setResults([]);
      setError(getAccommodationErrorMessage(err, 'occupancy.errors.search'));
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [enabled, query, spaceId, spaceType]);

  useEffect(() => {
    if (!enabled || query.trim().length < 1) {
      requestSeq.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      void runSearch();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, query, runSearch]);

  const reset = useCallback(() => {
    requestSeq.current += 1;
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  return { results, loading, error, reset };
}
