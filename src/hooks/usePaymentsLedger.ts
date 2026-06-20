import { useCallback, useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import type {
  DashboardFinancialSummary,
  MemberPaymentLedgerRow,
  SpaceType,
  UUID,
} from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';

export type PaymentLedgerFilter = 'all' | 'pending' | 'collected';

type PaymentsLedgerState = {
  loading: boolean;
  month: string;
  summary: DashboardFinancialSummary | null;
  members: MemberPaymentLedgerRow[];
  filteredMembers: MemberPaymentLedgerRow[];
  filter: PaymentLedgerFilter;
  setFilter: (filter: PaymentLedgerFilter) => void;
  setMonth: (month: string) => void;
  reload: () => Promise<void>;
};

function applyFilter(
  members: MemberPaymentLedgerRow[],
  filter: PaymentLedgerFilter,
): MemberPaymentLedgerRow[] {
  switch (filter) {
    case 'pending':
      return members.filter(row => row.status === 'PENDING' || row.status === 'PARTIAL');
    case 'collected':
      return members.filter(row => row.status === 'PAID' && (row.collected ?? 0) > 0);
    default:
      return members;
  }
}

export function usePaymentsLedger(
  spaceId: UUID,
  spaceType: SpaceType | undefined,
  enabled: boolean,
): PaymentsLedgerState {
  const [loading, setLoading] = useState(true);
  const [month, setMonthState] = useState(currentMonthKey());
  const [filter, setFilter] = useState<PaymentLedgerFilter>('all');
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

  useEffect(() => {
    if (enabled && spaceType) {
      void load();
    }
  }, [enabled, load, month, spaceType]);

  const setMonth = useCallback((nextMonth: string) => {
    setMonthState(nextMonth);
  }, []);

  return {
    loading,
    month,
    summary,
    members,
    filteredMembers: applyFilter(members, filter),
    filter,
    setFilter,
    setMonth,
    reload: load,
  };
}
