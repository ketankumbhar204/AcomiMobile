import {
  buildSubmittedBedPricing,
  buildSubmittedBedPricingValues,
  changedPricingFields,
  formatPricingMoney,
  moneyEquals,
} from '../commitBedPricing';

describe('commitBedPricing helpers', () => {
  it('builds rent-only submitted payload', () => {
    expect(buildSubmittedBedPricing(6000, 3000, 'defaultRent', 250)).toEqual({
      defaultRent: 250,
      defaultDeposit: 3000,
    });
  });

  it('builds deposit-only submitted payload', () => {
    expect(buildSubmittedBedPricing(6000, 3000, 'defaultDeposit', 2500)).toEqual({
      defaultRent: 6000,
      defaultDeposit: 2500,
    });
  });

  it('formats actual old and new money values', () => {
    expect(formatPricingMoney(6000, 'Not set')).toBe('₹6,000');
    expect(formatPricingMoney(250, 'Not set')).toBe('₹250');
    expect(formatPricingMoney(null, 'Not set')).toBe('Not set');
  });

  it('treats null and undefined money as equal', () => {
    expect(moneyEquals(null, undefined)).toBe(true);
    expect(moneyEquals(6000, 250)).toBe(false);
  });

  it('builds a dual-field submitted payload', () => {
    expect(buildSubmittedBedPricingValues(7000, 3500)).toEqual({
      defaultRent: 7000,
      defaultDeposit: 3500,
    });
  });

  it('detects rent-only, deposit-only, both, and no pricing changes', () => {
    expect(changedPricingFields(5000, 2500, 6000, 2500)).toEqual(['defaultRent']);
    expect(changedPricingFields(5000, 2500, 5000, 3000)).toEqual(['defaultDeposit']);
    expect(changedPricingFields(5000, 2500, 6000, 3000)).toEqual([
      'defaultRent',
      'defaultDeposit',
    ]);
    expect(changedPricingFields(5000, 2500, 5000, 2500)).toEqual([]);
    expect(changedPricingFields(null, undefined, null, null)).toEqual([]);
  });
});
