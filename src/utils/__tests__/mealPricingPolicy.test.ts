import {
  mealPricingContextFromSpaceType,
  requiresMealPrices,
  showMealPrices,
  usesSeparateMealBilling,
} from '../mealPricingPolicy';

describe('mealPricingPolicy', () => {
  it('enables separate meal billing for MESS', () => {
    const ctx = mealPricingContextFromSpaceType('MESS');
    expect(usesSeparateMealBilling(ctx)).toBe(true);
    expect(requiresMealPrices(ctx)).toBe(true);
    expect(showMealPrices(ctx)).toBe(true);
  });

  it('disables separate meal billing for PG accommodation', () => {
    const ctx = mealPricingContextFromSpaceType('PG');
    expect(usesSeparateMealBilling(ctx)).toBe(false);
    expect(requiresMealPrices(ctx)).toBe(false);
    expect(showMealPrices(ctx)).toBe(false);
  });

  it('disables separate meal billing for hostel and co-living', () => {
    expect(usesSeparateMealBilling(mealPricingContextFromSpaceType('HOSTEL'))).toBe(false);
    expect(usesSeparateMealBilling(mealPricingContextFromSpaceType('CO_LIVING'))).toBe(false);
  });
});
