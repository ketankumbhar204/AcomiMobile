import type { UpdateDepositRequest } from '../api/types';

export function parseDepositAmount(value: number | string | undefined): number {
  if (value === undefined || value === null) {
    return 0;
  }
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(amount: number | string): string {
  const value = parseDepositAmount(amount);
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function validateDeposit(body: UpdateDepositRequest): string | null {
  const { depositAmount, depositPaid, depositRefunded } = body;

  if (depositAmount < 0 || depositPaid < 0 || depositRefunded < 0) {
    return 'membership.deposit.errors.negative';
  }
  if (depositPaid > depositAmount) {
    return 'membership.deposit.errors.paidExceedsAmount';
  }
  if (depositRefunded > depositPaid) {
    return 'membership.deposit.errors.refundedExceedsPaid';
  }
  return null;
}
