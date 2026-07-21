import { useCallback, useEffect, useRef, useState } from 'react';
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

function normalizeMonthActivity(data: MemberMealActivityMonth): MemberMealActivityMonth {
  const summary = data.summary ?? {
    acceptedMeals: 0,
    pendingResponses: 0,
    skippedMeals: 0,
    amountGenerated: null,
    paidAmount: null,
    pendingAmount: null,
    currencyCode: 'INR',
  };
  return {
    ...data,
    summary: {
      ...summary,
      amountGenerated:
        summary.amountGenerated != null ? Number(summary.amountGenerated) : null,
      paidAmount: summary.paidAmount != null ? Number(summary.paidAmount) : null,
      pendingAmount: summary.pendingAmount != null ? Number(summary.pendingAmount) : null,
      balanceRemaining:
        summary.balanceRemaining != null ? Number(summary.balanceRemaining) : null,
      balancePurchased:
        summary.balancePurchased != null ? Number(summary.balancePurchased) : null,
      balanceConsumed:
        summary.balanceConsumed != null ? Number(summary.balanceConsumed) : null,
      amountPaidThisMonth:
        summary.amountPaidThisMonth != null ? Number(summary.amountPaidThisMonth) : null,
    },
    days: normalizeActivityMonthDays(data.days ?? []),
  };
}

export function useMemberMealActivity(spaceId: UUID, memberId: UUID, enabled = true) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(currentMonthKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<MemberMealActivityMonth | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await mealsApi.getMemberMealActivity(spaceId, memberId, month);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setActivity(normalizeMonthActivity(data));
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (__DEV__) {
        console.warn('[useMemberMealActivity] load failed', {
          spaceId,
          memberId,
          month,
          err,
        });
      }
      setError(t('meals.activity.loadError'));
      setActivity(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
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
