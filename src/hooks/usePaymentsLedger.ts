import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { ApiError } from '../api/types';
import type {
  DashboardFinancialSummary,
  MemberPaymentLedgerRow,
  SpaceType,
  UUID,
} from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  applyPaymentLedgerFilter,
  defaultPaymentListFilters,
  paymentFiltersFromLegacy,
  type PaymentLedgerFilter,
  type PaymentListFilterState,
} from '../utils/paymentLedger';

export type { PaymentLedgerFilter, PaymentListFilterState };

type PaymentsLedgerState = {
  loading: boolean;
  error: string | null;
  month: string;
  summary: DashboardFinancialSummary | null;
  members: MemberPaymentLedgerRow[];
  filteredMembers: MemberPaymentLedgerRow[];
  filters: PaymentListFilterState;
  search: string;
  setFilters: (filters: PaymentListFilterState) => void;
  setFilter: (filter: PaymentLedgerFilter) => void;
  setSearch: (search: string) => void;
  setMonth: (month: string) => void;
  reload: () => Promise<void>;
};

function resolveLedgerErrorKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'payments.errors.network';
    }
    if (error.status === 401 || error.status === 403) {
      return 'payments.errors.forbidden';
    }
  }
  return 'payments.errors.loadLedger';
}

export function usePaymentsLedger(
  spaceId: UUID,
  spaceType: SpaceType | undefined,
  enabled: boolean,
): PaymentsLedgerState {
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonthState] = useState(currentMonthKey());
  const [filters, setFilters] = useState<PaymentListFilterState>(defaultPaymentListFilters);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<DashboardFinancialSummary | null>(null);
  const [members, setMembers] = useState<MemberPaymentLedgerRow[]>([]);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setSummary(null);
      setMembers([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    const requestMonth = month;
    setLoading(true);
    setError(null);
    try {
      // spaceType is only required for client-side fallback after 404
      const ledger = await dashboardApi.getMemberPaymentLedger(
        spaceId,
        spaceType ?? 'PG',
        requestMonth,
      );
      if (requestId !== requestIdRef.current) {
        return;
      }
      setSummary(ledger.summary);
      setMembers(ledger.members);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      console.error('[usePaymentsLedger] failed', err);
      setSummary(null);
      setMembers([]);
      setError(resolveLedgerErrorKey(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, month, spaceId, spaceType]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setSummary(null);
      setMembers([]);
      return;
    }
    setSummary(null);
    setMembers([]);
    void load();
  }, [enabled, load]);

  const setMonth = useCallback((nextMonth: string) => {
    setMonthState(nextMonth);
  }, []);

  const setFilter = useCallback((filter: PaymentLedgerFilter) => {
    setFilters(paymentFiltersFromLegacy(filter));
  }, []);

  return {
    loading,
    error,
    month,
    summary,
    members,
    filteredMembers: applyPaymentLedgerFilter(members, filters, search),
    filters,
    search,
    setFilters,
    setFilter,
    setSearch,
    setMonth,
    reload: load,
  };
}
