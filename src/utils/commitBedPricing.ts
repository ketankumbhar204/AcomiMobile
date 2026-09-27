export type PricingField = 'defaultRent' | 'defaultDeposit';

export function moneyEquals(
  left: number | null | undefined,
  right: number | null | undefined,
): boolean {
  return (left ?? null) === (right ?? null);
}

export function formatPricingMoney(value: number | null | undefined, notSet = 'Not set'): string {
  if (value == null || Number.isNaN(value)) {
    return notSet;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

/** Pricing fields the existing PUT will send for a single-field edit. */
export function buildSubmittedBedPricing(
  currentRent: number | null | undefined,
  currentDeposit: number | null | undefined,
  field: PricingField,
  value: number | null,
): { defaultRent: number | null; defaultDeposit: number | null } {
  return buildSubmittedBedPricingValues(
    field === 'defaultRent' ? value : (currentRent ?? null),
    field === 'defaultDeposit' ? value : (currentDeposit ?? null),
  );
}

export function buildSubmittedBedPricingValues(
  nextRent: number | null | undefined,
  nextDeposit: number | null | undefined,
): { defaultRent: number | null; defaultDeposit: number | null } {
  return {
    defaultRent: nextRent ?? null,
    defaultDeposit: nextDeposit ?? null,
  };
}

export function changedPricingFields(
  currentRent: number | null | undefined,
  currentDeposit: number | null | undefined,
  nextRent: number | null | undefined,
  nextDeposit: number | null | undefined,
): PricingField[] {
  const changed: PricingField[] = [];
  if (!moneyEquals(currentRent, nextRent)) {
    changed.push('defaultRent');
  }
  if (!moneyEquals(currentDeposit, nextDeposit)) {
    changed.push('defaultDeposit');
  }
  return changed;
}
