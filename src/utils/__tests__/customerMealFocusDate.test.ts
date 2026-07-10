import {
  pollCardSelectPromptKey,
  pollCardTitleKey,
  pollCardTitleUsesDateParam,
} from '../mealDates';
import { canShiftCustomerMealDate } from '../customerMealFocusDate';

describe('customer meal date helpers', () => {
  it('uses today title when polls are for today', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 9, 12, 0, 0));
    expect(pollCardTitleKey('2026-07-09', 'active')).toBe('dashboard.pollCard.titleReadyToday');
    expect(pollCardTitleKey('2026-07-09', 'empty')).toBe('dashboard.pollCard.titleToday');
    expect(pollCardTitleUsesDateParam('2026-07-09', 'active')).toBe(false);
    jest.useRealTimers();
  });

  it('uses date-specific title for non-relative dates', () => {
    expect(pollCardTitleKey('2026-07-12', 'active')).toBe('dashboard.pollCard.titleReadyDate');
    expect(pollCardTitleUsesDateParam('2026-07-12', 'active')).toBe(true);
    expect(pollCardSelectPromptKey('2026-07-12', 3)).toBe('dashboard.pollCard.selectPromptDate');
  });

  it('uses formatted date param for yesterday meal summary titles', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 10, 12, 0, 0));
    expect(pollCardTitleKey('2026-07-09', 'complete')).toBe('dashboard.pollCard.titleMealsDate');
    expect(pollCardTitleUsesDateParam('2026-07-09', 'complete')).toBe(true);
    jest.useRealTimers();
  });

  it('limits customer date navigation within allowed bounds', () => {
    const today = '2026-07-09';
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 9, 12, 0, 0));
    expect(canShiftCustomerMealDate(today, -1)).toBe(true);
    expect(canShiftCustomerMealDate('2026-07-08', -1)).toBe(false);
    expect(canShiftCustomerMealDate(today, 7)).toBe(true);
    expect(canShiftCustomerMealDate('2026-07-16', 1)).toBe(false);
    jest.useRealTimers();
  });
});
