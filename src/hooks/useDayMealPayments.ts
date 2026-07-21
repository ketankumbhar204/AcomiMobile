import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type { MemberMealActivityMonth, UUID } from '../api/types';
import { createRequestGuard } from '../modules/orchestrator';
import { normalizeActivityMonthDays } from '../utils/memberMealActivityHistory';
import {
  buildDayMealPaymentListItems,
  buildDayMealPaymentMonthSummary,
} from '../utils/dayMealPayments';
import { shiftMonthKey } from './useMemberMealActivity';
import {
  dayMealPaymentsMonthCache,
  invalidateDayMealPaymentsMonth,
} from '../utils/paymentsMonthCache';
import type { DayMealPaymentsMonthSnapshot } from './dayMealPaymentsTypes';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeMonth(data: MemberMealActivityMonth): MemberMealActivityMonth {
  return {
    ...data,
    summary: {
      ...data.summary,
      amountGenerated:
        data.summary.amountGenerated != null ? Number(data.summary.amountGenerated) : null,
      paidAmount: data.summary.paidAmount != null ? Number(data.summary.paidAmount) : null,
      pendingAmount: data.summary.pendingAmount != null ? Number(data.summary.pendingAmount) : null,
    },
    days: normalizeActivityMonthDays(data.days ?? []),
  };
}

/**
 * Customer pay-per-meal payments month SoT.
 * Section tabs filter local state only — no focus refetch.
 */
export function useDayMealPaymentsMonth(
  spaceId: UUID,
  memberId: UUID | null | undefined,
  enabled = true,
) {
  const [month, setMonth] = useState(currentMonthKey);
  const [snapshot, setSnapshot] = useState<DayMealPaymentsMonthSnapshot | null>(null);
  const snapshotRef = useRef<DayMealPaymentsMonthSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const guard = useMemo(() => createRequestGuard(), []);

  const commit = useCallback(
    (activity: MemberMealActivityMonth, requestMonth: string) => {
      const items = buildDayMealPaymentListItems(activity);
      const next: DayMealPaymentsMonthSnapshot = {
        month: requestMonth,
        activity,
        items,
        summary: buildDayMealPaymentMonthSummary(items, requestMonth),
      };
      snapshotRef.current = next;
      setSnapshot(next);
      setError(false);
      setRefreshError(false);
      if (memberId) {
        dayMealPaymentsMonthCache.set(
          dayMealPaymentsMonthCache.key([spaceId, memberId, requestMonth]),
          next,
        );
      }
    },
    [memberId, spaceId],
  );

  const load = useCallback(
    async (requestMonth: string, options?: { force?: boolean }) => {
      if (!enabled || !memberId) {
        snapshotRef.current = null;
        setSnapshot(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const cacheKey = dayMealPaymentsMonthCache.key([spaceId, memberId, requestMonth]);
      if (!options?.force) {
        const cached = dayMealPaymentsMonthCache.get(cacheKey);
        if (cached) {
          snapshotRef.current = cached;
          setSnapshot(cached);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const hasData = snapshotRef.current != null;
      const requestId = guard.next();
      if (hasData) {
        setRefreshing(true);
        setRefreshError(false);
      } else {
        setLoading(true);
        setError(false);
      }

      try {
        const data = await mealsApi.getMemberMealActivity(spaceId, memberId, requestMonth);
        if (!guard.isCurrent(requestId)) {
          return;
        }
        commit(normalizeMonth(data), requestMonth);
      } catch {
        if (!guard.isCurrent(requestId)) {
          return;
        }
        if (hasData) {
          setRefreshError(true);
        } else {
          setError(true);
          snapshotRef.current = null;
          setSnapshot(null);
        }
      } finally {
        if (guard.isCurrent(requestId)) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [commit, enabled, guard, memberId, spaceId],
  );

  useEffect(() => {
    void load(month);
  }, [load, month]);

  const goToPreviousMonth = useCallback(() => {
    setMonth(prev => shiftMonthKey(prev, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth(prev => shiftMonthKey(prev, 1));
  }, []);

  const reload = useCallback(async () => {
    if (memberId) {
      invalidateDayMealPaymentsMonth(spaceId, memberId, month);
    }
    await load(month, { force: true });
  }, [load, memberId, month, spaceId]);

  return {
    month,
    loading: loading && snapshot == null,
    refreshing,
    error: snapshot == null && error,
    refreshError,
    activity: snapshot?.activity ?? null,
    items: snapshot?.items ?? [],
    summary: snapshot?.summary ?? buildDayMealPaymentMonthSummary([], month),
    reload,
    goToPreviousMonth,
    goToNextMonth,
  };
}

/** @deprecated Prefer useDayMealPaymentsMonth */
export function useDayMealPayments(
  spaceId: UUID,
  memberId: UUID | null | undefined,
  enabled = true,
) {
  return useDayMealPaymentsMonth(spaceId, memberId, enabled);
}
