import { createMonthCache } from '../modules/orchestrator';
import type { OwnerPaymentsMonthSnapshot } from '../hooks/ownerPaymentsTypes';
import type { SpacePaymentResponse } from '../api/types';
import type { DayMealPaymentsMonthSnapshot } from '../hooks/dayMealPaymentsTypes';

/** Owner Payments month snapshot cache — one SoT per space+month. */
export const ownerPaymentsMonthCache = createMonthCache<OwnerPaymentsMonthSnapshot>({
  ttlMs: 90_000,
});

/** Tenant universal payments month cache. */
export const tenantPaymentsMonthCache = createMonthCache<{
  payments: SpacePaymentResponse[];
  month: string;
}>({ ttlMs: 90_000 });

/** Day-meal payments month cache. */
export const dayMealPaymentsMonthCache = createMonthCache<DayMealPaymentsMonthSnapshot>({
  ttlMs: 90_000,
});

export function invalidateOwnerPaymentsMonth(spaceId: string, month?: string): void {
  if (month) {
    // Cover aggregate keys `spaceId|month` and summary keys `summary|spaceId|month`.
    ownerPaymentsMonthCache.invalidate(ownerPaymentsMonthCache.key([spaceId, month]));
    ownerPaymentsMonthCache.invalidate(
      ownerPaymentsMonthCache.key(['summary', spaceId, month]),
    );
  } else {
    ownerPaymentsMonthCache.invalidate(spaceId);
    ownerPaymentsMonthCache.invalidate(`summary|${spaceId}`);
  }
}

export function invalidateTenantPaymentsMonth(spaceId: string, month?: string): void {
  // Tenant keys are `spaceId|memberId|month` — prefix by spaceId so member-scoped entries clear.
  void month;
  tenantPaymentsMonthCache.invalidate(spaceId);
}

export function invalidateDayMealPaymentsMonth(
  spaceId: string,
  memberId: string,
  month?: string,
): void {
  if (month) {
    dayMealPaymentsMonthCache.invalidate(
      dayMealPaymentsMonthCache.key([spaceId, memberId, month]),
    );
  } else {
    dayMealPaymentsMonthCache.invalidate(`${spaceId}|${memberId}`);
  }
}

/** After any payment mutation that affects owner + tenant month views. */
export function invalidatePaymentsMonthCaches(spaceId: string, month?: string): void {
  invalidateOwnerPaymentsMonth(spaceId, month);
  invalidateTenantPaymentsMonth(spaceId, month);
  dayMealPaymentsMonthCache.invalidate(spaceId);
}
