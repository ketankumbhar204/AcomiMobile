import {
  applyStayChoice,
  pricingDefaultsForStayChoice,
  shortStayCrossesCalendarMonth,
} from '../shortStay';

describe('applyStayChoice', () => {
  const monthly = {
    memberId: 'm',
    rentSnapshot: 8500 as number | undefined,
    depositSnapshot: 2000,
    stayKind: undefined as 'MONTHLY' | 'SHORT' | 'OPEN_ENDED' | undefined,
    agreedTotal: undefined as number | undefined,
    expectedExitDate: undefined as string | undefined,
    expectedCheckoutDate: undefined as string | undefined,
  };

  it('marks monthly explicitly so transfer does not inherit SHORT', () => {
    const result = applyStayChoice(monthly, {
      enabled: true,
      choice: 'MONTHLY',
      agreedTotal: 5600,
    });
    expect(result.errorKey).toBeNull();
    expect(result.body.stayKind).toBe('MONTHLY');
    expect(result.body.agreedTotal).toBeUndefined();
    expect(result.body.rentSnapshot).toBe(8500);
  });

  it('sends one agreed total and drops monthly rent for a short stay', () => {
    const result = applyStayChoice(monthly, {
      enabled: true,
      choice: 'SHORT',
      agreedTotal: 5600,
      checkInDate: '2026-11-01',
      expectedExitDate: '2026-11-08',
    });
    expect(result.errorKey).toBeNull();
    expect(result.body.stayKind).toBe('SHORT');
    expect(result.body.agreedTotal).toBe(5600);
    expect(result.body.rentSnapshot).toBeUndefined();
    expect(result.body.expectedExitDate).toBe('2026-11-08');
    expect(result.body.expectedCheckoutDate).toBe('2026-11-08');
  });

  it('applies short stay even when enabled is false (flag ignored)', () => {
    const result = applyStayChoice(monthly, {
      enabled: false,
      choice: 'SHORT',
      agreedTotal: 5600,
      checkInDate: '2026-11-01',
      expectedExitDate: '2026-11-08',
    });
    expect(result.errorKey).toBeNull();
    expect(result.body.stayKind).toBe('SHORT');
    expect(result.body.agreedTotal).toBe(5600);
    expect(result.body.rentSnapshot).toBeUndefined();
  });

  it('rejects same-day short stay checkout (D-05 shipping)', () => {
    const result = applyStayChoice(monthly, {
      enabled: true,
      choice: 'SHORT',
      agreedTotal: 500,
      checkInDate: '2026-11-03',
      expectedExitDate: '2026-11-03',
    });
    expect(result.errorKey).toBe('occupancy.errors.codes.SHORT_STAY_SAME_DAY');
  });

  it('rejects cross-month short stay (D-05 shipping)', () => {
    const result = applyStayChoice(monthly, {
      enabled: true,
      choice: 'SHORT',
      agreedTotal: 900,
      checkInDate: '2026-11-28',
      expectedExitDate: '2026-12-02',
    });
    expect(result.errorKey).toBe('occupancy.errors.codes.SHORT_STAY_CROSSES_MONTH');
  });
});

describe('shortStayCrossesCalendarMonth', () => {
  it('allows same-month half-open nights', () => {
    expect(shortStayCrossesCalendarMonth('2026-11-01', '2026-11-08')).toBe(false);
  });

  it('flags when last night is in the next month', () => {
    expect(shortStayCrossesCalendarMonth('2026-11-28', '2026-12-02')).toBe(true);
  });
});

describe('pricingDefaultsForStayChoice', () => {
  it('clears monthly rent when switching to Short Stay', () => {
    const short = pricingDefaultsForStayChoice({
      choice: 'SHORT',
      catalogRent: 6000,
      catalogDeposit: 3000,
    });
    expect(short.rentSnapshot).toBe('');
    expect(short.agreedTotal).toBe('');
    expect(short.depositSnapshot).toBe('3000');
  });

  it('reloads catalog rent when switching back to Monthly', () => {
    const monthly = pricingDefaultsForStayChoice({
      choice: 'MONTHLY',
      catalogRent: 6000,
      catalogDeposit: 3000,
    });
    expect(monthly.rentSnapshot).toBe('6000');
    expect(monthly.depositSnapshot).toBe('3000');
  });
});
