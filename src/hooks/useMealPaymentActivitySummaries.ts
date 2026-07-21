import { useCallback, useEffect, useMemo, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type { MemberMealActivityMonth, SpacePaymentResponse, UUID } from '../api/types';
import { normalizeActivityMonthDays } from '../utils/memberMealActivityHistory';
import {
  buildMealSummaryFromActivityMonth,
  type MealSelectionSummaryModel,
} from '../utils/mealSelectionSummary';

function normalizeMonthActivity(data: MemberMealActivityMonth): MemberMealActivityMonth {
  return {
    ...data,
    summary: {
      ...data.summary,
      amountGenerated:
        data.summary.amountGenerated != null ? Number(data.summary.amountGenerated) : null,
      paidAmount: data.summary.paidAmount != null ? Number(data.summary.paidAmount) : null,
      pendingAmount: data.summary.pendingAmount != null ? Number(data.summary.pendingAmount) : null,
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
  };
}

/** Load meal activity for payment months (existing API) and map to summary models. */
export function useMealPaymentActivitySummaries(
  spaceId: UUID,
  memberId: UUID | null | undefined,
  payments: SpacePaymentResponse[],
  enabled = true,
) {
  const [activityByMonth, setActivityByMonth] = useState<
    Record<string, MemberMealActivityMonth | null>
  >({});
  const [loading, setLoading] = useState(false);

  const mealMonths = useMemo(() => {
    const months = new Set<string>();
    for (const payment of payments) {
      if (payment.paymentType === 'MEAL' && payment.month) {
        months.add(payment.month);
      }
    }
    return [...months].sort();
  }, [payments]);

  const monthsKey = mealMonths.join(',');

  const load = useCallback(async () => {
    if (!enabled || !memberId || mealMonths.length === 0) {
      setActivityByMonth({});
      return;
    }
    setLoading(true);
    try {
      const entries = await Promise.all(
        mealMonths.map(async month => {
          try {
            const data = await mealsApi.getMemberMealActivity(spaceId, memberId, month);
            return [month, normalizeMonthActivity(data)] as const;
          } catch {
            return [month, null] as const;
          }
        }),
      );
      const next: Record<string, MemberMealActivityMonth | null> = {};
      for (const [month, activity] of entries) {
        next[month] = activity;
      }
      setActivityByMonth(next);
    } finally {
      setLoading(false);
    }
  }, [enabled, mealMonths, memberId, spaceId]);

  useEffect(() => {
    void load();
  }, [load, monthsKey]);

  const summaryByPaymentId = useMemo(() => {
    const map: Record<string, MealSelectionSummaryModel | null> = {};
    for (const payment of payments) {
      if (payment.paymentType !== 'MEAL') {
        continue;
      }
      const activity = activityByMonth[payment.month];
      const model = buildMealSummaryFromActivityMonth(activity);
      if (!model) {
        map[payment.paymentId] = null;
        continue;
      }
      map[payment.paymentId] = {
        ...model,
        totalAmount: Number(payment.amount),
        currencyCode: payment.currencyCode || model.currencyCode,
      };
    }
    return map;
  }, [activityByMonth, payments]);

  return {
    loading,
    summaryByPaymentId,
    activityByMonth,
    reload: load,
  };
}
