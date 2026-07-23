import {
  buildRecentOrdersFromActivity,
  countMenuItemsByMeal,
  countMenuItemsFromPolls,
  countUpcomingPayments,
} from '../customerDashboardStats';
import type { MealPollSlot, MemberMealActivityMonth } from '../../api/types';

describe('customerDashboardStats', () => {
  const polls = [
    {
      mealType: 'BREAKFAST',
      options: [
        { optionType: 'MENU_ENTRY', id: '1' },
        { optionType: 'MENU_ENTRY', id: '2' },
        { optionType: 'NOT_AVAILABLE', id: '3' },
      ],
    },
    {
      mealType: 'LUNCH',
      options: [{ optionType: 'MENU_ENTRY', id: '4' }],
    },
  ] as unknown as MealPollSlot[];

  it('counts menu items across polls', () => {
    expect(countMenuItemsFromPolls(polls)).toBe(3);
    expect(countMenuItemsByMeal(polls)).toEqual({
      BREAKFAST: 2,
      LUNCH: 1,
    });
  });

  it('builds recent orders from activity days', () => {
    const activity = {
      summary: { acceptedMeals: 2, pendingResponses: 0, skippedMeals: 0, currencyCode: 'INR' },
      days: [
        {
          date: '2026-07-20',
          paymentStatus: 'PAID',
          dayTotal: 120,
          currencyCode: 'INR',
          slots: [
            { mealType: 'LUNCH', status: 'ACCEPTED', quantity: 2 },
            { mealType: 'DINNER', status: 'SKIPPED' },
          ],
        },
        {
          date: '2026-07-21',
          paymentStatus: 'PENDING',
          dayTotal: 80,
          slots: [{ mealType: 'BREAKFAST', status: 'ACCEPTED', quantity: 1 }],
        },
      ],
    } as unknown as MemberMealActivityMonth;

    const rows = buildRecentOrdersFromActivity(activity, 4);
    expect(rows[0].date).toBe('2026-07-21');
    expect(rows[0].itemCount).toBe(1);
    expect(countUpcomingPayments(activity)).toBe(1);
  });
});
