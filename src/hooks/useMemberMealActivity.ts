import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../api/mealsApi';
import type { MemberMealActivityMonth, UUID } from '../api/types';
import { normalizeActivityMonthDays } from '../utils/memberMealActivityHistory';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonthKey(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function useMemberMealActivity(spaceId: UUID, memberId: UUID, enabled = true) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(currentMonthKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<MemberMealActivityMonth | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await mealsApi.getMemberMealActivity(spaceId, memberId, month);
      setActivity({
        ...data,
        summary: {
          ...data.summary,
          amountGenerated:
            data.summary.amountGenerated != null ? Number(data.summary.amountGenerated) : null,
          paidAmount: data.summary.paidAmount != null ? Number(data.summary.paidAmount) : null,
          pendingAmount:
            data.summary.pendingAmount != null ? Number(data.summary.pendingAmount) : null,
          balanceRemaining:
            data.summary.balanceRemaining != null ? Number(data.summary.balanceRemaining) : null,
          balancePurchased:
            data.summary.balancePurchased != null ? Number(data.summary.balancePurchased) : null,
          balanceConsumed:
            data.summary.balanceConsumed != null ? Number(data.summary.balanceConsumed) : null,
          amountPaidThisMonth:
            data.summary.amountPaidThisMonth != null
              ? Number(data.summary.amountPaidThisMonth)
              : null,
        },
        days: normalizeActivityMonthDays(data.days ?? []),
      });
    } catch {
      setError(t('meals.activity.loadError'));
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, memberId, month, spaceId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const goToPreviousMonth = useCallback(() => {
    setMonth(prev => shiftMonthKey(prev, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth(prev => shiftMonthKey(prev, 1));
  }, []);

  return {
    month,
    loading,
    error,
    activity,
    reload: load,
    goToPreviousMonth,
    goToNextMonth,
  };
}
