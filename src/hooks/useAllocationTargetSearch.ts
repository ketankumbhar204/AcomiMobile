import { useCallback, useEffect, useRef, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type {
  AccommodationStatus,
  AllocationTargetSearchResponse,
  UUID,
} from '../api/types';
import { DEFAULT_LIST_PAGE_SIZE } from '../api/accommodationListQuery';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';

const DEBOUNCE_MS = 300;

type UseAllocationTargetSearchOptions = {
  buildingId?: UUID;
  floorId?: UUID;
  unitId?: UUID;
  status?: AccommodationStatus;
  selectableOnly?: boolean;
  enabled?: boolean;
};

export function useAllocationTargetSearch(
  spaceId: UUID,
  query: string,
  options: UseAllocationTargetSearchOptions = {},
) {
  const {
    buildingId,
    floorId,
    unitId,
    status,
    selectableOnly = true,
    enabled = true,
  } = options;

  const [results, setResults] = useState<AllocationTargetSearchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const requestSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const seq = ++requestSeq.current;
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const response = await accommodationApi.searchAllocationTargets(spaceId, {
          query: query.trim() || undefined,
          buildingId,
          floorId,
          unitId,
          status,
          selectableOnly,
          page: pageNum,
          size: DEFAULT_LIST_PAGE_SIZE,
        });
        if (seq !== requestSeq.current) {
          return;
        }
        setResults(prev =>
          append ? [...prev, ...response.content] : response.content,
        );
        setPage(response.page);
        setHasMore(!response.last);
      } catch (err) {
        if (seq !== requestSeq.current) {
          return;
        }
        setError(getAccommodationErrorMessage(err, 'occupancyWizard.errors.searchTargets'));
        if (!append) {
          setResults([]);
        }
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [buildingId, floorId, selectableOnly, spaceId, status, unitId, query],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchPage(0, false);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) {
      return;
    }
    void fetchPage(page + 1, true);
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  const reset = useCallback(() => {
    requestSeq.current += 1;
    setResults([]);
    setPage(0);
    setHasMore(false);
    setError(null);
  }, []);

  return { results, loading, loadingMore, error, hasMore, loadMore, reset };
}
