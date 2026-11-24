import { useCallback, useEffect, useRef, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type {
  MemberDirectoryPersonResponse,
  MemberDirectorySearchParams,
  MemberStatus,
  SpaceType,
  UUID,
} from '../api/types';
import { getMembershipErrorMessage } from '../utils/membershipErrors';

const DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 20;

type UseMemberDirectoryOptions = {
  enabled?: boolean;
  pageSize?: number;
  spaceId?: UUID;
  spaceType?: SpaceType;
  status?: MemberStatus;
};

/**
 * Owner-level member directory (GET /members/directory).
 * Debounced search, page-by-page accumulation for infinite scroll.
 */
export function useMemberDirectory(query: string, options: UseMemberDirectoryOptions = {}) {
  const {
    enabled = true,
    pageSize = DEFAULT_PAGE_SIZE,
    spaceId,
    spaceType,
    status,
  } = options;

  const [people, setPeople] = useState<MemberDirectoryPersonResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(false);
  const busyRef = useRef(false);

  const buildParams = useCallback(
    (nextPage: number): MemberDirectorySearchParams => ({
      search: query.trim() || undefined,
      page: nextPage,
      size: pageSize,
      spaceId,
      spaceType,
      status,
    }),
    [pageSize, query, spaceId, spaceType, status],
  );

  const loadFirstPage = useCallback(async () => {
    const seq = ++requestSeq.current;
    busyRef.current = true;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    try {
      const data = await memberApi.getDirectory(buildParams(0));
      if (seq !== requestSeq.current) {
        return;
      }
      const more = data.last === false && (data.content?.length ?? 0) > 0;
      setPeople(data.content ?? []);
      setPage(0);
      pageRef.current = 0;
      hasMoreRef.current = more;
      setHasMore(more);
      setTotalElements(data.totalElements ?? data.content?.length ?? 0);
    } catch (err) {
      if (seq !== requestSeq.current) {
        return;
      }
      setPeople([]);
      hasMoreRef.current = false;
      setHasMore(false);
      setError(getMembershipErrorMessage(err, 'membership.members.directoryLoadFailed'));
    } finally {
      if (seq === requestSeq.current) {
        busyRef.current = false;
        setLoading(false);
      }
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (!enabled || busyRef.current || !hasMoreRef.current) {
      return;
    }
    const seq = requestSeq.current;
    const nextPage = pageRef.current + 1;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const data = await memberApi.getDirectory(buildParams(nextPage));
      if (seq !== requestSeq.current) {
        return;
      }
      const incoming = data.content ?? [];
      setPeople(prev => {
        const seen = new Set(prev.map(person => person.directoryId));
        return [...prev, ...incoming.filter(person => !seen.has(person.directoryId))];
      });
      setPage(nextPage);
      pageRef.current = nextPage;
      const more = data.last === false && incoming.length > 0;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (err) {
      if (seq !== requestSeq.current) {
        return;
      }
      setError(getMembershipErrorMessage(err, 'membership.members.directoryLoadFailed'));
    } finally {
      if (seq === requestSeq.current) {
        busyRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [buildParams, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void loadFirstPage();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, loadFirstPage]);

  const reset = useCallback(() => {
    requestSeq.current += 1;
    busyRef.current = false;
    pageRef.current = 0;
    hasMoreRef.current = false;
    setPeople([]);
    setPage(0);
    setHasMore(false);
    setTotalElements(0);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
  }, []);

  return {
    people,
    page,
    hasMore,
    totalElements,
    loading,
    loadingMore,
    error,
    loadMore,
    reset,
    refetch: loadFirstPage,
  };
}
