import {
  buildReviseOpenEndedRentRequest,
  defaultRentEffectiveFromYmd,
  previousRateThroughYmd,
} from '../reviseOpenEndedRent';

describe('reviseOpenEndedRent', () => {
  it('defaults effective-from to the next calendar day', () => {
    expect(defaultRentEffectiveFromYmd('2026-11-06')).toBe('2026-11-07');
    expect(defaultRentEffectiveFromYmd('2026-11-30')).toBe('2026-12-01');
  });

  it('computes previous-rate-through as the day before effective-from', () => {
    expect(previousRateThroughYmd('2026-11-10')).toBe('2026-11-09');
  });

  it('builds a rent-only request without planned end or additional amount', () => {
    const body = buildReviseOpenEndedRentRequest({
      currentDailyRent: 1000,
      newDailyRent: '1200',
      effectiveFrom: '2026-11-10',
      reasonCode: 'RENT_REVISION',
      reasonOther: '',
      idempotencyKey: 'key-1',
    });
    expect(body).toEqual({
      idempotencyKey: 'key-1',
      rentSnapshot: 1200,
      rentEffectiveMonth: '2026-11-10',
      reason: 'Rent revision',
    });
    expect(body).not.toHaveProperty('expectedExitDate');
    expect(body).not.toHaveProperty('additionalAmount');
  });

  it('rejects unchanged and missing current rent', () => {
    expect(() =>
      buildReviseOpenEndedRentRequest({
        currentDailyRent: 1000,
        newDailyRent: '1000',
        effectiveFrom: '2026-11-10',
        reasonCode: '',
        reasonOther: '',
        idempotencyKey: 'key-1',
      }),
    ).toThrow('RENT_UNCHANGED');

    expect(() =>
      buildReviseOpenEndedRentRequest({
        currentDailyRent: null,
        newDailyRent: '1200',
        effectiveFrom: '2026-11-10',
        reasonCode: '',
        reasonOther: '',
        idempotencyKey: 'key-1',
      }),
    ).toThrow('CURRENT_RENT_MISSING');
  });
});
