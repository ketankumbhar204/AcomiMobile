import { mealsApi } from '../../api/mealsApi';
import {
  pollCardSelectPromptKey,
  pollCardTitleKey,
  pollCardTitleUsesDateParam,
} from '../mealDates';
import {
  canShiftCustomerMealDate,
  CUSTOMER_MEAL_DATE_MIN_OFFSET,
  resolveCustomerMealFocusDate,
} from '../customerMealFocusDate';

describe('customer meal date helpers', () => {
  it('uses today title when polls are for today', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 9, 12, 0, 0));
    expect(pollCardTitleKey('2026-07-09', 'active')).toBe('dashboard.pollCard.titleReadyToday');
    expect(pollCardTitleKey('2026-07-09', 'empty')).toBe('dashboard.pollCard.titleToday');
    expect(pollCardTitleUsesDateParam('2026-07-09', 'active')).toBe(false);
    jest.useRealTimers();
  });

  it('uses date-specific title for non-relative dates', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 9, 12, 0, 0));
    expect(pollCardTitleKey('2026-07-12', 'active')).toBe('dashboard.pollCard.titleReadyDate');
    expect(pollCardTitleUsesDateParam('2026-07-12', 'active')).toBe(true);
    expect(pollCardSelectPromptKey('2026-07-12', 3)).toBe('dashboard.pollCard.selectPromptDate');
    jest.useRealTimers();
  });

  it('uses formatted date param for yesterday meal summary titles', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 10, 12, 0, 0));
    expect(pollCardTitleKey('2026-07-09', 'complete')).toBe('dashboard.pollCard.titleMealsDate');
    expect(pollCardTitleUsesDateParam('2026-07-09', 'complete')).toBe(true);
    jest.useRealTimers();
  });

  it('skips empty today and focuses the next planned menu day', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 12, 12, 0, 0));
    const getMealPolls = jest
      .spyOn(mealsApi, 'getMealPolls')
      .mockImplementation(async (_spaceId, menuDate) => {
        if (menuDate === '2026-07-12') {
          return { polls: [] } as Awaited<ReturnType<typeof mealsApi.getMealPolls>>;
        }
        if (menuDate === '2026-07-13') {
          return {
            polls: [{ id: '1' }],
          } as Awaited<ReturnType<typeof mealsApi.getMealPolls>>;
        }
        return { polls: [] } as Awaited<ReturnType<typeof mealsApi.getMealPolls>>;
      });
    await expect(resolveCustomerMealFocusDate('space-1', 'MESS')).resolves.toBe('2026-07-13');
    getMealPolls.mockRestore();
    jest.useRealTimers();
  });

  it('allows browsing further back while keeping a future bound', () => {
    const today = '2026-07-09';
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 9, 12, 0, 0));
    expect(CUSTOMER_MEAL_DATE_MIN_OFFSET).toBe(-90);
    expect(canShiftCustomerMealDate(today, -1)).toBe(true);
    expect(canShiftCustomerMealDate('2026-07-08', -1)).toBe(true);
    // minDate = 2026-04-10; cannot step earlier than that
    expect(canShiftCustomerMealDate('2026-04-10', -1)).toBe(false);
    expect(canShiftCustomerMealDate(today, 7)).toBe(true);
    expect(canShiftCustomerMealDate('2026-07-16', 1)).toBe(false);
    jest.useRealTimers();
  });
});
