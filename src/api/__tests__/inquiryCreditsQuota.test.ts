import {
  directContactDecision,
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

  it('keeps instant viewing available after email enquiry credits are exhausted', () => {
    const emailExhausted = quota({ freeRemainingToday: 0, availableCredits: 0, viewHereRemainingToday: 2 });
    const availability = inquiryMethodAvailability(emailExhausted);
    expect(availability.emailExhausted).toBe(true);
    expect(availability.showViewHere).toBe(true);
  });

  it('falls back from instant viewing when the view quota is exhausted', () => {
    const viewsExhausted = quota({ viewHereRemainingToday: 0, freeRemainingToday: 4, availableCredits: 2 });
    const availability = inquiryMethodAvailability(viewsExhausted);
    expect(availability.showViewHere).toBe(false);
    expect(availability.showViewHereExhausted).toBe(true);
    expect(availability.emailExhausted).toBe(false);
  });

  it('reveals contacts only when this platform still has free views', () => {
    expect(directContactDecision(quota())).toBe('reveal');
    expect(directContactDecision(quota({ viewHereRemainingToday: 0 }))).toBe('exhausted');
    expect(directContactDecision(quota({ viewHereDailyLimit: 0, viewHereRemainingToday: 0 }))).toBe(
      'disabled',
    );
  });
});
