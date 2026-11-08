import { resolveBookingAdvanceSplit } from '../bookingAdvance';

describe('bookingAdvance', () => {
  it('returns null split when advance is blank or zero', () => {
    expect(
      resolveBookingAdvanceSplit({ firstPeriodRent: 6000, bookingAdvanceText: '' }).split,
    ).toBeNull();
    expect(
      resolveBookingAdvanceSplit({ firstPeriodRent: 6000, bookingAdvanceText: '0' }).split,
    ).toBeNull();
  });

  it('splits first-period rent into advance and remaining', () => {
    expect(
      resolveBookingAdvanceSplit({ firstPeriodRent: 6000, bookingAdvanceText: '2000' }).split,
    ).toEqual({
      firstPeriodRent: 6000,
      bookingAdvance: 2000,
      remainingRent: 4000,
    });
  });

  it('rejects advance above rent', () => {
    expect(
      resolveBookingAdvanceSplit({ firstPeriodRent: 6000, bookingAdvanceText: '7000' }).errorKey,
    ).toBe('occupancy.bookingAdvance.errors.exceedsRent');
  });
});
