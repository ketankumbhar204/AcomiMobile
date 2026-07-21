import {
  buildDayMealPaymentListItems,
  buildDayMealPaymentMonthSummary,
  filterDayMealPaymentsInSection,
  resolveDayMealPaymentDisplayStatus,
  resolvePreferredDayMealPaymentsSection,
} from '../dayMealPayments';
import type { MemberMealActivityMonth } from '../../api/types';

describe('dayMealPayments', () => {
  const activity = {
    month: '2026-07',
    summary: {
      acceptedMeals: 5,
      pendingResponses: 0,
      skippedMeals: 0,
      amountGenerated: 750,
      paidAmount: null,
      pendingAmount: 750,
      currencyCode: 'INR',
    },
    days: [
      {
        date: '2026-07-12',
        hasActivity: true,
        dayTotal: 180,
        currencyCode: 'INR',
        paymentStatus: 'PENDING',
        slots: [
          { mealType: 'BREAKFAST', status: 'ACCEPTED', quantity: 1 },
          { mealType: 'LUNCH', status: 'ACCEPTED', quantity: 1 },
          { mealType: 'DINNER', status: 'PENDING' },
        ],
      },
      {
        date: '2026-07-13',
        hasActivity: true,
        dayTotal: 150,
        currencyCode: 'INR',
        paymentStatus: null,
        slots: [
          { mealType: 'BREAKFAST', status: 'NO_MENU' },
          { mealType: 'LUNCH', status: 'NO_MENU' },
          { mealType: 'DINNER', status: 'ACCEPTED', quantity: 2 },
        ],
      },
      {
        date: '2026-07-14',
        hasActivity: true,
        dayTotal: 420,
        currencyCode: 'INR',
        paymentStatus: 'PENDING_APPROVAL',
        slots: [
          { mealType: 'LUNCH', status: 'ACCEPTED', quantity: 2 },
          { mealType: 'DINNER', status: 'ACCEPTED', quantity: 3 },
          { mealType: 'BREAKFAST', status: 'PENDING' },
        ],
      },
      {
        date: '2026-07-01',
        hasActivity: true,
        dayTotal: null,
        currencyCode: 'INR',
        paymentStatus: null,
        slots: [
          { mealType: 'BREAKFAST', status: 'NO_MENU' },
          { mealType: 'LUNCH', status: 'NO_MENU' },
          { mealType: 'DINNER', status: 'NO_MENU' },
        ],
      },
    ],
  } as unknown as MemberMealActivityMonth;

  it('builds one list item per charged day', () => {
    const items = buildDayMealPaymentListItems(activity, '2026-07-13');
    expect(items.map(item => item.date)).toEqual(['2026-07-14', '2026-07-13', '2026-07-12']);
    expect(items.find(item => item.date === '2026-07-12')?.mealTypes).toEqual([
      'BREAKFAST',
      'LUNCH',
    ]);
  });

  it('marks past unpaid days overdue', () => {
    expect(resolveDayMealPaymentDisplayStatus('PENDING', '2026-07-12', '2026-07-13')).toBe(
      'OVERDUE',
    );
    expect(resolveDayMealPaymentDisplayStatus(null, '2026-07-13', '2026-07-13')).toBe('PENDING');
  });

  it('sections pending vs under review', () => {
    const items = buildDayMealPaymentListItems(activity, '2026-07-13');
    expect(filterDayMealPaymentsInSection(items, 'actionNeeded')).toHaveLength(2);
    expect(filterDayMealPaymentsInSection(items, 'underReview')).toHaveLength(1);
  });

  it('builds informational month summary without merging payments', () => {
    const items = buildDayMealPaymentListItems(activity, '2026-07-13');
    const summary = buildDayMealPaymentMonthSummary(items, '2026-07');
    expect(summary.pendingCount).toBe(2);
    expect(summary.pendingAmount).toBe(330);
    expect(summary.totalAmount).toBe(750);
  });

  it('opens under review when action needed is empty', () => {
    const items = buildDayMealPaymentListItems(activity, '2026-07-13').filter(
      item => item.displayStatus === 'PENDING_APPROVAL' || item.displayStatus === 'PAID',
    );
    expect(resolvePreferredDayMealPaymentsSection(items, 'actionNeeded')).toBe('underReview');
  });
});
