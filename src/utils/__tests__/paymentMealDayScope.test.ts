import { resolvePaymentMealDetailDates, toPaymentIsoDate } from '../paymentMealDayScope';

describe('paymentMealDayScope', () => {
  it('normalizes due dates to YYYY-MM-DD', () => {
    expect(toPaymentIsoDate('2026-07-14')).toBe('2026-07-14');
    expect(toPaymentIsoDate('2026-07-14T12:00:00')).toBe('2026-07-14');
    expect(toPaymentIsoDate(null)).toBeNull();
  });

  it('prefers mealDates from the payment (what was paid)', () => {
    expect(
      resolvePaymentMealDetailDates({
        paymentType: 'MEAL',
        paymentCategory: 'DAILY',
        dueDate: '2026-07-14',
        mealDates: ['2026-07-12', '2026-07-13', '2026-07-14'],
      }),
    ).toEqual(['2026-07-12', '2026-07-13', '2026-07-14']);
  });

  it('falls back to dueDate for single-day daily payments', () => {
    expect(
      resolvePaymentMealDetailDates({
        paymentType: 'MEAL',
        paymentCategory: 'DAILY',
        dueDate: '2026-07-14',
        mealDates: null,
      }),
    ).toEqual(['2026-07-14']);
  });

  it('omits meal-day breakdown for monthly meal payments without mealDates', () => {
    expect(
      resolvePaymentMealDetailDates({
        paymentType: 'MEAL',
        paymentCategory: 'MONTHLY',
        dueDate: '2026-07-31',
        mealDates: [],
      }),
    ).toEqual([]);
  });
});
