import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_LIST_PAGE_SIZE } from '../api/accommodationListQuery';
import type { ListQueryParams, PagedResponse } from '../api/types';
import {
  getAccommodationInvalidationGeneration,
  queryKeyLabel,
  subscribeAccommodationInvalidation,
} from '../utils/accommodationQueryCache';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import { mergeInactiveListItems } from '../utils/accommodationInactiveRegistry';
import { devLog } from '../utils/devLog';

const SEARCH_DEBOUNCE_MS = 300;

export type UseAccommodationPagedListOptions<T> = {
  enabled?: boolean;
  searchQuery?: string;
  pageSize?: number;
  sort?: string;
  errorKey: string;
  logTag: string;
  queryKey: readonly unknown[];
  inactiveScopeKey?: string | null;
  getItemId?: (item: T) => string;
};

export function useAccommodationPagedList<T extends { active?: boolean }>(
  fetchPage: (params: ListQueryParams) => Promise<PagedResponse<T>>,
  options: UseAccommodationPagedListOptions<T>,
) {
  const {
    enabled = true,
    searchQuery = '',
    pageSize = DEFAULT_LIST_PAGE_SIZE,
    sort,
    errorKey,
    logTag,
    queryKey,
    inactiveScopeKey,
    getItemId,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const requestSeq = useRef(0);
  const pageRef = useRef(0);
  const [cacheGeneration, setCacheGeneration] = useState(
    getAccommodationInvalidationGeneration(),
  );

  useEffect(() => {
    return subscribeAccommodationInvalidation(() => {
      setCacheGeneration(getAccommodationInvalidationGeneration());
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      const seq = ++requestSeq.current;
      devLog(`[${logTag}] queryKey`, queryKeyLabel(queryKey), { page, query: debouncedQuery });

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const params: ListQueryParams = {
          page,
          size: pageSize,
          sort,
          includeInactive: true,
        };
        if (debouncedQuery) {
          params.query = debouncedQuery;
        }

        const data = await fetchPage(params);

        if (seq !== requestSeq.current) {
          devLog(`[${logTag}] stale response ignored`);
          return;
        }

        pageRef.current = data.page;
        setHasMore(!data.last);
        setTotalElements(data.totalElements);
        const nextPageItems = data.content;
        setItems(prev => {
          const merged = append ? [...prev, ...nextPageItems] : nextPageItems;
          if (!append && inactiveScopeKey && getItemId) {
            return mergeInactiveListItems(merged, inactiveScopeKey, getItemId);
          }
          return merged;
        });
        devLog(`[${logTag}] loaded page`, data.page, 'items', data.content.length);
      } catch (err) {
        if (seq !== requestSeq.current) {
          return;
        }
        const message = getAccommodationErrorMessage(err, errorKey);
        console.error(`[${logTag}] failed`, err);
        setError(message);
        if (!append) {
          setItems([]);
          setHasMore(false);
          setTotalElements(0);
        }
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedQuery, errorKey, fetchPage, logTag, pageSize, queryKey, sort],
  );

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setHasMore(false);
      setTotalElements(0);
      return;
    }
    pageRef.current = 0;
    await loadPage(0, false);
  }, [enabled, loadPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || !hasMore) {
      return;
    }
    await loadPage(pageRef.current + 1, true);
  }, [enabled, hasMore, loading, loadingMore, loadPage]);

  const patchItems = useCallback((predicate: (item: T) => boolean, patch: Partial<T>) => {
    setItems(prev =>
      prev.map(item => (predicate(item) ? { ...item, ...patch } : item)),
    );
  }, []);

  useEffect(() => {
    requestSeq.current += 1;
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setHasMore(false);
      return;
    }
    pageRef.current = 0;
    void loadPage(0, false);
  }, [cacheGeneration, debouncedQuery, enabled, loadPage]);

  const removeItems = useCallback((predicate: (item: T) => boolean) => {
    setItems(prev => prev.filter(item => !predicate(item)));
  }, []);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    totalElements,
    refresh,
    loadMore,
    patchItems,
    removeItems,
  };
}
