import { defaultPriceBasis, isPriceBasis, listingPriceSuffix } from './priceBasis';

describe('priceBasis', () => {
  const translate = (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key;

  it('keeps the property and mess defaults', () => {
    expect(defaultPriceBasis('PG')).toBe('PER_BED');
    expect(defaultPriceBasis('HOSTEL')).toBe('PER_BED');
    expect(defaultPriceBasis('CO_LIVING')).toBe('PER_ROOM');
    expect(defaultPriceBasis('RENTAL')).toBe('PER_UNIT');
    expect(defaultPriceBasis('MESS')).toBe('PER_UNIT');
  });

  it('displays a saved unit instead of the type default', () => {
    expect(listingPriceSuffix(translate, 'PG', 'PER_ROOM')).toBe('per room / month');
    expect(listingPriceSuffix(translate, 'PG', null)).toBe('/ month');
    expect(isPriceBasis('PER_UNIT')).toBe(true);
    expect(isPriceBasis('PER_MEAL')).toBe(false);
  });
});
