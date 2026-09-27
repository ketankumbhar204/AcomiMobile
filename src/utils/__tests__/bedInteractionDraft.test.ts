import {
  hasBedNumberChange,
  hasBedPricingChange,
  isBedDraftUnchanged,
  isOccupancyMoneyMissing,
  moneyToDraftText,
  parseBedMoneyText,
} from '../bedInteractionDraft';

describe('bedInteractionDraft', () => {
  it('parses money text the same way as setup autofill', () => {
    expect(parseBedMoneyText('6000')).toBe(6000);
    expect(parseBedMoneyText('')).toBeNull();
    expect(parseBedMoneyText('abc')).toBeNull();
  });

  it('treats empty draft money as unset', () => {
    expect(moneyToDraftText(null)).toBe('');
    expect(moneyToDraftText(6000)).toBe('6000');
  });

  it('detects unchanged drafts so Save can stay disabled', () => {
    const current = { bedNumber: 'C', rent: 6000, deposit: 3000 };
    expect(isBedDraftUnchanged(current, current)).toBe(true);
    expect(
      isBedDraftUnchanged(current, { bedNumber: ' C ', rent: 6000, deposit: 3000 }),
    ).toBe(true);
    expect(
      isBedDraftUnchanged(current, { bedNumber: 'C', rent: 7000, deposit: 3000 }),
    ).toBe(false);
  });

  it('detects rent, deposit, and name changes independently', () => {
    expect(hasBedPricingChange({ rent: 5, deposit: 2 }, { rent: 6, deposit: 2 })).toBe(true);
    expect(hasBedPricingChange({ rent: 5, deposit: 2 }, { rent: 5, deposit: 3 })).toBe(true);
    expect(hasBedPricingChange({ rent: 5, deposit: 2 }, { rent: 6, deposit: 3 })).toBe(true);
    expect(hasBedPricingChange({ rent: 5, deposit: 2 }, { rent: 5, deposit: 2 })).toBe(false);
    expect(hasBedNumberChange('C', 'C')).toBe(false);
    expect(hasBedNumberChange('C', 'D')).toBe(true);
  });

  it('treats only empty money as missing for allocate/reserve', () => {
    expect(isOccupancyMoneyMissing(null)).toBe(true);
    expect(isOccupancyMoneyMissing(undefined)).toBe(true);
    expect(isOccupancyMoneyMissing('')).toBe(true);
    expect(isOccupancyMoneyMissing('   ')).toBe(true);
    expect(isOccupancyMoneyMissing(0)).toBe(false);
    expect(isOccupancyMoneyMissing('0')).toBe(false);
    expect(isOccupancyMoneyMissing('3000')).toBe(false);
    expect(isOccupancyMoneyMissing(3000)).toBe(false);
    expect(isOccupancyMoneyMissing(6000)).toBe(false);
  });
});
