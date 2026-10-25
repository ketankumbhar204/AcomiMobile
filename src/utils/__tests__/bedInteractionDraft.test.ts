import {
  bedTargetAfterDetailsSave,
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

  it('keeps the same bed selected after rent and deposit are saved', () => {
    const target = {
      bedId: 'bed-b',
      roomId: 'room-b',
      bedNumber: 'B',
      label: 'Bed B',
      rent: 5000,
      deposit: 2000,
      locationLine: 'Room B · Unit 101 · Floor 1 · Sunrise PG',
      occupancyTarget: {
        bedId: 'bed-b',
        roomId: 'room-b',
        bedName: 'Bed B',
      },
    };

    const rentOnly = bedTargetAfterDetailsSave(target, {
      bedNumber: 'B',
      rent: 6000,
      deposit: 2000,
    });
    expect(rentOnly.bedId).toBe('bed-b');
    expect(rentOnly.rent).toBe(6000);
    expect(rentOnly.deposit).toBe(2000);
    expect(rentOnly.locationLine).toBe(target.locationLine);

    const depositOnly = bedTargetAfterDetailsSave(target, {
      bedNumber: 'B',
      rent: 5000,
      deposit: 3000,
    });
    expect(depositOnly.bedId).toBe('bed-b');
    expect(depositOnly.deposit).toBe(3000);

    const both = bedTargetAfterDetailsSave(target, {
      bedNumber: ' B ',
      rent: 6000,
      deposit: 3000,
    });
    expect(both.bedId).toBe('bed-b');
    expect(both.bedNumber).toBe('B');
    expect(both.label).toBe('B');
    expect(both.rent).toBe(6000);
    expect(both.deposit).toBe(3000);
    expect(both.occupancyTarget).toEqual({
      bedId: 'bed-b',
      roomId: 'room-b',
      bedName: 'B',
    });
  });
});
