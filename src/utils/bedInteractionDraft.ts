import { parseOptionalMoney } from '../components/accommodation/setup-preview/setupPricingAutofill';
import { moneyEquals } from './commitBedPricing';

export type BedInteractionDraft = {
  bedNumber: string;
  rent: number | null;
  deposit: number | null;
};

export function parseBedMoneyText(value: string): number | null {
  return parseOptionalMoney(value);
}

/**
 * Missing occupancy money: null, undefined, empty/whitespace, or unparsable.
 * ₹0 / "0" is populated and valid.
 */
export function isOccupancyMoneyMissing(
  value: string | number | null | undefined,
): boolean {
  if (value == null) {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value);
  }
  return parseBedMoneyText(value) == null;
}

export function moneyToDraftText(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

export function isBedDraftUnchanged(
  current: BedInteractionDraft,
  next: BedInteractionDraft,
): boolean {
  return (
    current.bedNumber.trim() === next.bedNumber.trim() &&
    moneyEquals(current.rent, next.rent) &&
    moneyEquals(current.deposit, next.deposit)
  );
}

export function hasBedPricingChange(
  current: Pick<BedInteractionDraft, 'rent' | 'deposit'>,
  next: Pick<BedInteractionDraft, 'rent' | 'deposit'>,
): boolean {
  return !moneyEquals(current.rent, next.rent) || !moneyEquals(current.deposit, next.deposit);
}

export function hasBedNumberChange(
  currentNumber: string,
  nextNumber: string,
): boolean {
  return currentNumber.trim() !== nextNumber.trim();
}
