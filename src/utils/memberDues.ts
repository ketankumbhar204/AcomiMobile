/**
 * Member outstanding dues from the payment-month ledger.
 * Pending is the residual the Payments summary already uses
 * (expected − collected − under review). Contract rent is not a balance.
 * A missing ledger row is unknown, not proof that dues are ₹0.
 */

export type MemberDuesSnapshot = {
  pending: number | null;
  underReview?: number | null;
  expectedCharges: number | null;
  currencyCode?: string | null;
};

export type MemberDuesCue =
  | { kind: 'due'; amount: number }
  | { kind: 'review'; amount: number }
  | { kind: 'clear' }
  /** OPEN_ENDED daily rent: period still open, no rent row yet. Not clear, not overdue. */
  | { kind: 'notBilled' };

export type MemberPaymentDuesFilter = 'all' | 'pending' | 'clear';

const MONEY_EPSILON = 0.009;

function positive(amount: number | null | undefined): number | null {
  if (amount == null || Number.isNaN(amount) || amount <= MONEY_EPSILON) {
    return null;
  }
  return amount;
}

export function memberDuesCue(
  row: MemberDuesSnapshot | null | undefined,
  options?: {
    /** OPEN_ENDED daily-rate stay whose open period has no RENT payment row yet. */
    openEndedUnbilled?: boolean;
  },
): MemberDuesCue | null {
  if (!row) {
    return options?.openEndedUnbilled ? { kind: 'notBilled' } : null;
  }
  const pending = positive(row.pending);
  if (pending != null) {
    return { kind: 'due', amount: pending };
  }
  const underReview = positive(row.underReview);
  if (underReview != null) {
    return { kind: 'review', amount: underReview };
  }
  if (options?.openEndedUnbilled) {
    return { kind: 'notBilled' };
  }
  if (positive(row.expectedCharges) != null) {
    return { kind: 'clear' };
  }
  return null;
}

export function matchesPaymentDuesFilter(
  cue: MemberDuesCue | null,
  filter: MemberPaymentDuesFilter | undefined,
): boolean {
  if (!filter || filter === 'all') {
    return true;
  }
  if (filter === 'pending') {
    return cue?.kind === 'due';
  }
  return cue?.kind === 'clear';
}

export function formatDuesAmount(amount: number, currencyCode = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return currencyCode === 'INR' ? `₹${Math.round(amount)}` : `${Math.round(amount)} ${currencyCode}`;
  }
}
