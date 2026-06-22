import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardApi } from '../api/dashboardApi';
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

export function usePaymentsLedger(
  spaceId: UUID,
  spaceType: SpaceType | undefined,
  enabled: boolean,
): PaymentsLedgerState {
  const [loading, setLoading] = useState(true);
  const [month, setMonthState] = useState(currentMonthKey());
  const [filters, setFilters] = useState<PaymentListFilterState>(defaultPaymentListFilters);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<DashboardFinancialSummary | null>(null);
  const [members, setMembers] = useState<MemberPaymentLedgerRow[]>([]);

  const load = useCallback(async () => {
    if (!enabled || !spaceType) {
      setLoading(false);
      setSummary(null);
      setMembers([]);
      return;
    }

    setLoading(true);
    try {
      const ledger = await dashboardApi.getMemberPaymentLedger(spaceId, spaceType, month);
      setSummary(ledger.summary);
      setMembers(ledger.members);
    } finally {
      setLoading(false);
    }
  }, [enabled, month, spaceId, spaceType]);

  useFocusEffect(
    useCallback(() => {
      if (enabled && spaceType) {
        void load();
      }
    }, [enabled, load, spaceType]),
  );

  const setMonth = useCallback((nextMonth: string) => {
    setMonthState(nextMonth);
  }, []);

  const setFilter = useCallback((filter: PaymentLedgerFilter) => {
    setFilters(paymentFiltersFromLegacy(filter));
  }, []);

  return {
    loading,
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
