import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { paymentsApi } from '../api/paymentsApi';
import type { MemberPaymentLedgerRow, MemberPaymentStatus, UUID } from '../api/types';
import { createRequestGuard } from '../modules/orchestrator';
import {
  defaultPaymentListFilters,
  paymentFiltersFromLegacy,
  type PaymentLedgerFilter,
  type PaymentListFilterState,
  type PaymentSortOption,
} from '../utils/paymentLedger';

const PAGE_SIZE = 20;

function statusParamFromFilters(filters: PaymentListFilterState): string | undefined {
  if (filters.preset === 'pending') {
    return 'PENDING';
  }
  if (filters.preset === 'collected') {
    return 'COLLECTED';
  }
  if (filters.preset === 'underReview') {
    return 'UNDER_REVIEW';
  }
  if (filters.statuses.size > 0) {
    return [...filters.statuses].join(',');
  }
  return undefined;
}

/**
 * Paginated Members tab. Loads only when enabled (active tab).
 * Search, status/preset, and sort are applied server-side.
 * Mount fires exactly one fetch — search/filter effects skip the initial paint.
 */
export function usePaymentsMembers(
  spaceId: UUID,
  month: string,
  enabled: boolean,
) {
  const [rows, setRows] = useState<MemberPaymentLedgerRow[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentListFilterState>(() =>
    defaultPaymentListFilters(),
  );
  const [search, setSearch] = useState('');
  const hasDataRef = useRef(false);
  const guard = useMemo(() => createRequestGuard(), []);
  const searchRef = useRef(search);
  const filtersRef = useRef(filters);
  const skipSearchEffectRef = useRef(true);
  const skipFilterEffectRef = useRef(true);
  searchRef.current = search;
  filtersRef.current = filters;

  const load = useCallback(
    async (pageIndex: number, options?: { force?: boolean; append?: boolean }) => {
      if (!enabled) {
        return;
      }
      const hasData = hasDataRef.current;
      const requestId = guard.next();
      if (hasData && !options?.append) {
        setRefreshing(true);
        setRefreshError(null);
      } else if (!hasData) {
        setLoading(true);
        setError(null);
      }

      try {
        const currentFilters = filtersRef.current;
        const response = await paymentsApi.getPaymentsMembers(spaceId, {
          month,
          page: pageIndex,
          size: PAGE_SIZE,
          q: searchRef.current.trim() || undefined,
          status: statusParamFromFilters(currentFilters),
          sort: currentFilters.sort,
        });
        if (!guard.isCurrent(requestId)) {
          return;
        }
        const content = response.page.content ?? [];
        hasDataRef.current = true;
        setRows(prev => (options?.append ? [...prev, ...content] : content));
        setPage(response.page.page);
        setTotalElements(response.page.totalElements);
        setError(null);
        setRefreshError(null);
      } catch {
        if (!guard.isCurrent(requestId)) {
          return;
        }
        if (hasData) {
          setRefreshError('payments.errors.loadLedger');
        } else {
          setError('payments.errors.loadLedger');
        }
      } finally {
        if (guard.isCurrent(requestId)) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, guard, month, spaceId],
  );

  // Primary load: enable / month / load identity only. One request on open.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    hasDataRef.current = false;
    setRows([]);
    setPage(0);
    void load(0);
  }, [enabled, load, month]);

  // Debounced search — skip first mount (primary effect already loaded).
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (skipSearchEffectRef.current) {
      skipSearchEffectRef.current = false;
      return;
    }
    const handle = setTimeout(() => {
      hasDataRef.current = false;
      setPage(0);
      void load(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [enabled, load, search]);

  const filterKey = `${filters.preset ?? ''}|${filters.sort}|${[...filters.statuses].sort().join(',')}`;

  // Filters — skip first mount (primary effect already loaded).
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (skipFilterEffectRef.current) {
      skipFilterEffectRef.current = false;
      return;
    }
    hasDataRef.current = false;
    setPage(0);
    void load(0);
  }, [enabled, load, filterKey]);

  // When tab remounts (disabled→enabled), allow skip refs to reset for next open.
  useEffect(() => {
    if (!enabled) {
      skipSearchEffectRef.current = true;
      skipFilterEffectRef.current = true;
    }
  }, [enabled]);

  const setFilter = useCallback((filter: PaymentLedgerFilter) => {
    setFilters(paymentFiltersFromLegacy(filter));
  }, []);

  const reload = useCallback(async () => {
    await load(0, { force: true });
  }, [load]);

  const loadMore = useCallback(async () => {
    if (rows.length >= totalElements) {
      return;
    }
    await load(page + 1, { append: true });
  }, [load, page, rows.length, totalElements]);

  return {
    members: rows,
    /** Server already filtered — alias for screen compatibility. */
    filteredMembers: rows,
    filters,
    search,
    setFilters,
    setFilter,
    setSearch,
    loading: loading && rows.length === 0,
    refreshing,
    error: rows.length === 0 ? error : null,
    refreshError,
    reload,
    loadMore,
    hasMore: rows.length < totalElements,
    totalElements,
  };
}

export type { MemberPaymentStatus, PaymentSortOption };
