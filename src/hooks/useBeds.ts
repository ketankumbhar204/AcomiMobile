import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { AccommodationStatus, BedListItemResponse, ListQueryParams, UUID } from '../api/types';
import {
  accommodationQueryKeys,
  getAccommodationInvalidationGeneration,
  queryKeyLabel,
  subscribeAccommodationInvalidation,
} from '../utils/accommodationQueryCache';
import {
  getAccommodationErrorMessage,
  isAccommodationNotFoundError,
} from '../utils/accommodationErrors';
import { DEFAULT_LIST_PAGE_SIZE } from '../api/accommodationListQuery';
import {
  accommodationInactiveScopeKey,
  mergeInactiveListItems,
} from '../utils/accommodationInactiveRegistry';
import { devLog } from '../utils/devLog';

const SEARCH_DEBOUNCE_MS = 300;

export type BedsQueryContext = {
  spaceId: UUID;
  roomId: UUID;
  buildingId: UUID;
  floorId?: UUID;
  unitId?: UUID;
};

export function useBeds(
  context: BedsQueryContext | null,
  options?: { enabled?: boolean; searchQuery?: string; status?: AccommodationStatus | 'ALL' },
) {
  const enabled = options?.enabled ?? Boolean(context?.spaceId && context?.roomId);
  const searchQuery = options?.searchQuery ?? '';
  const statusFilter = options?.status ?? 'ALL';

  const [beds, setBeds] = useState<BedListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hasMore, setHasMore] = useState(false);
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

  const queryKey = useMemo(
    () =>
      context
        ? accommodationQueryKeys.beds(context.spaceId, context.roomId, {
            query: debouncedQuery,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
          })
        : (['beds'] as const),
    [context, debouncedQuery, statusFilter],
  );

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      if (!context || !enabled) {
        return;
      }

      const { spaceId, roomId, buildingId, floorId, unitId } = context;
      const seq = ++requestSeq.current;
      devLog('[useBeds] queryKey', queryKeyLabel(queryKey), { page });

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
        setNotFound(false);
      }

      try {
        if (!append) {
          devLog('[useBeds] preflight GET /spaces/' + spaceId + '/rooms/' + roomId);
          const room = await accommodationApi.getRoom(spaceId, roomId);

          if (seq !== requestSeq.current) {
            return;
          }

          if (floorId && room.floorId && room.floorId !== floorId) {
            setError(getAccommodationErrorMessage(null, 'accommodation.errors.notInSpace'));
            setNotFound(true);
            setBeds([]);
            return;
          }

          if (unitId && room.unitId && room.unitId !== unitId) {
            setError(getAccommodationErrorMessage(null, 'accommodation.errors.notInSpace'));
            setNotFound(true);
            setBeds([]);
            return;
          }

          if (room.buildingId && room.buildingId !== buildingId) {
            setError(getAccommodationErrorMessage(null, 'accommodation.errors.notInSpace'));
            setNotFound(true);
            setBeds([]);
            return;
          }
        }

        const params: ListQueryParams = {
          page,
          size: DEFAULT_LIST_PAGE_SIZE,
          sort: 'bedNumber',
          includeInactive: true,
        };
        if (debouncedQuery) {
          params.query = debouncedQuery;
        }
        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }

        const data = await accommodationApi.listBeds(spaceId, roomId, params);

        if (seq !== requestSeq.current) {
          return;
        }

        pageRef.current = data.page;
        setHasMore(!data.last);
        const inactiveScopeKey =
          context != null
            ? accommodationInactiveScopeKey('bed', {
                spaceId: context.spaceId,
                roomId: context.roomId,
              })
            : null;
        const mergedBeds =
          !append && inactiveScopeKey
            ? mergeInactiveListItems(data.content, inactiveScopeKey, bed => bed.bedId)
            : data.content;
        setBeds(prev => (append ? [...prev, ...data.content] : mergedBeds));
      } catch (err) {
        if (seq !== requestSeq.current) {
          return;
        }
        const is404 = isAccommodationNotFoundError(err);
        const message = getAccommodationErrorMessage(
          err,
          is404 ? 'accommodation.errors.notInSpace' : 'accommodation.errors.loadBeds',
        );
        setError(message);
        setNotFound(is404);
        if (!append) {
          setBeds([]);
          setHasMore(false);
        }
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [context, debouncedQuery, enabled, queryKey, statusFilter],
  );

  const refresh = useCallback(async () => {
    if (!context || !enabled) {
      setBeds([]);
      return;
    }
    pageRef.current = 0;
    await loadPage(0, false);
  }, [context, enabled, loadPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || !hasMore) {
      return;
    }
    await loadPage(pageRef.current + 1, true);
  }, [enabled, hasMore, loadPage, loading, loadingMore]);

  const patchBed = useCallback((bedId: UUID, patch: Partial<BedListItemResponse>) => {
    setBeds(prev =>
      prev.map(bed => (bed.bedId === bedId ? { ...bed, ...patch } : bed)),
    );
  }, []);

  useEffect(() => {
    requestSeq.current += 1;
    if (!enabled || !context) {
      setBeds([]);
      setLoading(false);
      return;
    }
    pageRef.current = 0;
    void loadPage(0, false);
  }, [
    cacheGeneration,
    context?.buildingId,
    context?.floorId,
    context?.roomId,
    context?.spaceId,
    context?.unitId,
    debouncedQuery,
    enabled,
    loadPage,
  ]);

  const removeBed = useCallback((bedId: UUID) => {
    setBeds(prev => prev.filter(bed => bed.bedId !== bedId));
  }, []);

  return { beds, loading, loadingMore, error, notFound, hasMore, refresh, loadMore, patchBed, removeBed };
}
