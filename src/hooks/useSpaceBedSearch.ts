import { useCallback, useEffect, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { AccommodationStatus, BedSpaceListItemResponse, UUID } from '../api/types';
import { dedupeBedsById } from '../utils/groupBedsByRoom';

const PAGE_SIZE = 100;

type UseSpaceBedSearchOptions = {
  spaceId: UUID;
  status: AccommodationStatus;
  query?: string;
  buildingId?: UUID;
  floorId?: UUID;
  unitId?: UUID;
  enabled?: boolean;
  /** Fetch all pages for client-side grouping (dashboard bed browser). */
  loadAll?: boolean;
};

export function useSpaceBedSearch({
  spaceId,
  status,
  query = '',
  buildingId,
  floorId,
  unitId,
  enabled = true,
  loadAll = false,
}: UseSpaceBedSearchOptions) {
  const [items, setItems] = useState<BedSpaceListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      return accommodationApi.searchBeds(spaceId, {
        status,
        query: query.trim() || undefined,
        buildingId,
        floorId,
        unitId,
        page: pageNum,
        size: PAGE_SIZE,
      });
    },
    [buildingId, floorId, query, spaceId, status, unitId],
  );

  const loadPage = useCallback(
    async (pageNum: number, append: boolean, silent = false) => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      if (pageNum === 0 && !silent) {
        setLoading(true);
      } else if (pageNum > 0) {
        setLoadingMore(true);
      }

      try {
        if (loadAll && pageNum === 0) {
          let pageIndex = 0;
          let merged: BedSpaceListItemResponse[] = [];
          let last = false;
          let total = 0;

          while (!last) {
            const response = await fetchPage(pageIndex);
            merged = dedupeBedsById(
              pageIndex === 0 ? response.content : [...merged, ...response.content],
            );
            last = response.last;
            total = response.totalElements;
            pageIndex += 1;
          }

          setItems(merged);
          setPage(pageIndex - 1);
          setHasMore(false);
          setTotalElements(total);
          setError(null);
          return;
        }

        const response = await fetchPage(pageNum);
        setItems(prev =>
          dedupeBedsById(append ? [...prev, ...response.content] : response.content),
        );
        setPage(pageNum);
        setHasMore(!response.last);
        setTotalElements(response.totalElements);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load beds');
        if (!append) {
          setItems([]);
          setTotalElements(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [enabled, fetchPage, loadAll],
  );

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(0, false, true);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loadAll) {
      return;
    }
    await loadPage(page + 1, true, true);
  }, [hasMore, loadAll, loadPage, loadingMore, page]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    totalElements,
    error,
    refresh,
    loadMore,
  };
}
