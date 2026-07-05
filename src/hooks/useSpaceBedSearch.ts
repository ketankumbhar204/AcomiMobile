import { useCallback, useEffect, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { AccommodationStatus, BedSpaceListItemResponse, UUID } from '../api/types';

type UseSpaceBedSearchOptions = {
  spaceId: UUID;
  status: AccommodationStatus;
  query?: string;
  buildingId?: UUID;
  floorId?: UUID;
  unitId?: UUID;
  enabled?: boolean;
};

export function useSpaceBedSearch({
  spaceId,
  status,
  query = '',
  buildingId,
  floorId,
  unitId,
  enabled = true,
}: UseSpaceBedSearchOptions) {
  const [items, setItems] = useState<BedSpaceListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const response = await accommodationApi.searchBeds(spaceId, {
          status,
          query: query.trim() || undefined,
          buildingId,
          floorId,
          unitId,
          page: pageNum,
          size: 20,
        });
        setItems(prev => (append ? [...prev, ...response.content] : response.content));
        setPage(pageNum);
        setHasMore(!response.last);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load beds');
        if (!append) {
          setItems([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [buildingId, enabled, floorId, query, spaceId, status, unitId],
  );

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(0, false, true);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    await loadPage(page + 1, true, true);
  }, [hasMore, loadPage, loadingMore, page]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
  };
}
