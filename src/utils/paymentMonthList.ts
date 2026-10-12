export type PaymentMonthListPreset = 'pending' | 'collected' | 'underReview' | null;

export type PaymentMonthListEmptyKind =
  | 'loading'
  | 'mismatch'
  | 'pending'
  | 'collected'
  | 'filtered'
  | 'none';

/** Ignore a list that still belongs to the previously selected month. */
export function shouldShowMonthPayments(
  selectedMonth: string,
  loadedMonth: string | null,
): boolean {
  return loadedMonth === selectedMonth;
}

/**
 * The pending summary and the payment list must describe the same month.
 * A non-zero pending total with no rows is a mismatch, not an empty month.
 */
export function paymentListEmptyKind(input: {
  selectedMonth: string;
  loadedMonth: string | null;
  loading?: boolean;
  pendingAmount?: number | null;
  recordCount: number;
  visibleCount: number;
  preset?: PaymentMonthListPreset;
  hasSearchOrExtraFilter?: boolean;
}): PaymentMonthListEmptyKind {
  if (input.loading || !shouldShowMonthPayments(input.selectedMonth, input.loadedMonth)) {
    return 'loading';
  }
  if (input.visibleCount > 0) {
    return 'none';
  }
  const pending = input.pendingAmount ?? 0;
  if (pending > 0 && input.recordCount === 0) {
    return 'mismatch';
  }
  if (input.preset === 'pending') {
    return pending > 0 ? 'filtered' : 'pending';
  }
  if (input.preset === 'collected') {
    return 'collected';
  }
  if (input.hasSearchOrExtraFilter) {
    return 'filtered';
  }
  return 'filtered';
}
