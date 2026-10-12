import {
  inquiryMethodAvailability,
  needsInquiryPayment,
  paidCreditsOf,
  type InquiryQuota,
} from '../inquiryCreditsApi';

function quota(overrides: Partial<InquiryQuota> = {}): InquiryQuota {
  return {
    dailyFreeLimit: 5,
    freeUsedToday: 0,
    freeRemainingToday: 5,
    availableCredits: 2,
    viewHereDailyLimit: 3,
    viewHereUsedToday: 0,
    viewHereRemainingToday: 3,
    ...overrides,
  };
}

describe('inquiry contact quota', () => {
  it('counts paid credits separately from the free daily allowance', () => {
    expect(paidCreditsOf(quota({ availableCredits: 4, freeRemainingToday: 0 }))).toBe(4);
    expect(needsInquiryPayment(quota({ availableCredits: 4, freeRemainingToday: 0 }))).toBe(false);
  });

  it('treats zero, missing, and invalid paid credits as none', () => {
    expect(paidCreditsOf(quota({ availableCredits: 0 }))).toBe(0);
    expect(paidCreditsOf(null)).toBe(0);
    expect(paidCreditsOf(quota({ availableCredits: Number.NaN }))).toBe(0);
  });

  it('does not throw while quota is still loading', () => {
    expect(inquiryMethodAvailability(null)).toEqual({
      dailyLimit: 0,
      remainingKnown: false,
      remainingToday: 0,
      paidLeft: 0,
      emailExhausted: false,
      viewHereLimit: 0,
      viewHereRemaining: 0,
      showViewHere: false,
      showViewHereExhausted: false,
    });
  });

  it('requires payment only after free email quota and paid credits are both gone', () => {
    const exhausted = quota({ freeRemainingToday: 0, availableCredits: 0 });
    expect(needsInquiryPayment(exhausted)).toBe(true);
    expect(inquiryMethodAvailability(exhausted).emailExhausted).toBe(true);
    expect(needsInquiryPayment(quota({ unlimited: true, freeRemainingToday: 0, availableCredits: 0 }))).toBe(
      false,
    );
  });

  it('shows View Here only while instant views remain', () => {
    expect(inquiryMethodAvailability(quota()).showViewHere).toBe(true);
    expect(
      inquiryMethodAvailability(quota({ viewHereRemainingToday: 0 })).showViewHereExhausted,
    ).toBe(true);
    expect(inquiryMethodAvailability(quota({ viewHereDailyLimit: 0 })).showViewHere).toBe(false);
  });
});
