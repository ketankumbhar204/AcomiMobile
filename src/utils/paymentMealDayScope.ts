import type { SpacePaymentResponse } from '../api/types';

/** Normalize payment dueDate / poll date values to YYYY-MM-DD. */
export function toPaymentIsoDate(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoMatch?.[1] ?? null;
}

/**
 * Meal days covered by this payment (what was paid).
 * Prefers API `mealDates`; falls back to daily dueDate only.
 */
export function resolvePaymentMealDetailDates(
  payment: Pick<
    SpacePaymentResponse,
    'paymentType' | 'paymentCategory' | 'dueDate' | 'mealDates'
  >,
): string[] {
  if (payment.paymentType !== 'MEAL') {
    return [];
  }

  const fromApi = (payment.mealDates ?? [])
    .map(toPaymentIsoDate)
    .filter((date): date is string => Boolean(date));
  if (fromApi.length > 0) {
    return [...new Set(fromApi)].sort((a, b) => a.localeCompare(b));
  }

  if (payment.paymentCategory !== 'DAILY') {
    return [];
  }
  const due = toPaymentIsoDate(payment.dueDate);
  return due ? [due] : [];
}
