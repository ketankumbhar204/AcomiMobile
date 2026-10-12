export type ListingPriceBasis = 'PER_BED' | 'PER_ROOM' | 'PER_UNIT';

export const PRICE_BASIS_OPTIONS: ListingPriceBasis[] = ['PER_BED', 'PER_ROOM', 'PER_UNIT'];

export const PRICE_BASIS_LABEL: Record<ListingPriceBasis, string> = {
  PER_BED: 'per bed / month',
  PER_ROOM: 'per room / month',
  PER_UNIT: 'per month',
};

export function defaultPriceBasis(type: string | null | undefined): ListingPriceBasis {
  if (type === 'PG' || type === 'HOSTEL') return 'PER_BED';
  if (type === 'CO_LIVING') return 'PER_ROOM';
  return 'PER_UNIT';
}

export function isPriceBasis(value: unknown): value is ListingPriceBasis {
  return value === 'PER_BED' || value === 'PER_ROOM' || value === 'PER_UNIT';
}

export function listingPriceSuffix(
  translate: (key: string, options?: { defaultValue?: string }) => string,
  type: string | null | undefined,
  priceBasis?: string | null,
): string {
  if (isPriceBasis(priceBasis)) {
    return translate(`spaces.findPlace.priceBasis.${priceBasis}`, {
      defaultValue: PRICE_BASIS_LABEL[priceBasis],
    });
  }
  return translate(`spaces.findPlace.priceSuffix.${type ?? 'RENTAL'}`, { defaultValue: '/ month' });
}
