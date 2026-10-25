import {
  buildRecentOrdersFromActivity,
  countMenuItemsByMeal,
  countMenuItemsFromPolls,
  countOpenMealPayments,
  countUpcomingPayments,
  summarizeMemberDashboardLedger,
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
    expect(countUpcomingPayments(activity, '2026-07-21')).toBe(0);
    expect(countOpenMealPayments(activity)).toBe(1);
  });
});

describe('summarizeMemberDashboardLedger', () => {
  const today = '2026-10-17';

  it('adds overdue rent and electricity into the due amount without counting them as upcoming', () => {
    const stats = summarizeMemberDashboardLedger(
      [
        {
          paymentStatus: 'PENDING',
          amount: 6000,
          outstandingAmount: 6000,
          dueDate: '2026-10-07',
          isOverdue: true,
        },
        {
          paymentStatus: 'PENDING',
          amount: 1000,
          outstandingAmount: 1000,
          dueDate: '2026-10-10',
          isOverdue: true,
        },
      ],
      today,
    );
    expect(stats.dueAmount).toBe(7000);
    expect(stats.upcomingCount).toBe(0);
    expect(stats.openPaymentCount).toBe(2);
  });

  it('shows zero when the loaded month has no outstanding balance', () => {
    expect(
      summarizeMemberDashboardLedger(
        [
          {
            paymentStatus: 'PAID',
            amount: 6000,
            outstandingAmount: 0,
            dueDate: '2026-10-05',
          },
        ],
        today,
      ),
    ).toEqual({ dueAmount: 0, upcomingCount: 0, openPaymentCount: 0 });
    expect(summarizeMemberDashboardLedger([], today).dueAmount).toBe(0);
  });

  it('counts only the remaining balance of a partial payment', () => {
    const stats = summarizeMemberDashboardLedger(
      [
        {
          paymentStatus: 'PENDING',
          amount: 6000,
          outstandingAmount: 2000,
          dueDate: '2026-10-20',
        },
      ],
      today,
    );
    expect(stats.dueAmount).toBe(2000);
    expect(stats.upcomingCount).toBe(1);
    expect(stats.openPaymentCount).toBe(1);
  });

  it('ignores a fully paid charge and keeps a future unpaid charge as upcoming', () => {
    const stats = summarizeMemberDashboardLedger(
      [
        {
          paymentStatus: 'PAID',
          amount: 6000,
          outstandingAmount: 0,
          dueDate: '2026-10-05',
        },
        {
          paymentStatus: 'PENDING',
          amount: 500,
          outstandingAmount: null,
          dueDate: '2026-10-28',
        },
      ],
      today,
    );
    expect(stats.dueAmount).toBe(500);
    expect(stats.upcomingCount).toBe(1);
    expect(stats.openPaymentCount).toBe(1);
  });

  it('keeps an under-review balance in the due amount and out of the upcoming count', () => {
    const stats = summarizeMemberDashboardLedger(
      [
        {
          paymentStatus: 'UNDER_REVIEW',
          amount: 6000,
          outstandingAmount: 6000,
          dueDate: '2026-10-05',
          isOverdue: true,
        },
      ],
      today,
    );
    expect(stats.dueAmount).toBe(6000);
    expect(stats.upcomingCount).toBe(0);
    expect(stats.openPaymentCount).toBe(0);
  });
});
