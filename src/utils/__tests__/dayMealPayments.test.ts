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

  it('shows a pending day at its outstanding amount, not the record count', () => {
    const items = buildDayMealPaymentListItems(
      {
        month: '2026-10',
        summary: { acceptedMeals: 2, pendingResponses: 0, skippedMeals: 1, currencyCode: 'INR' },
        days: [
          {
            date: '2026-10-09',
            hasActivity: true,
            dayTotal: 500,
            amountKnown: true,
            currencyCode: 'INR',
            paymentStatus: 'PENDING',
            slots: [
              { mealType: 'BREAKFAST', status: 'ACCEPTED', slotAmount: 40 },
              { mealType: 'LUNCH', status: 'SKIPPED', slotAmount: 0 },
              { mealType: 'DINNER', status: 'ACCEPTED', slotAmount: 460 },
            ],
          },
        ],
      } as unknown as MemberMealActivityMonth,
      '2026-10-10',
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.amount).toBe(500);
    expect(items[0]?.amountKnown).toBe(true);
    const summary = buildDayMealPaymentMonthSummary(items, '2026-10');
    expect(summary.pendingAmount).toBe(500);
    expect(summary.pendingCount).toBe(1);
    expect(summary.collectedAmount).toBe(0);
    expect(summary.totalAmount).toBe(500);
  });

  it('keeps a missing meal price unknown instead of zero or a count', () => {
    const items = buildDayMealPaymentListItems(
      {
        month: '2026-10',
        summary: { acceptedMeals: 2, pendingResponses: 0, skippedMeals: 0, currencyCode: 'INR' },
        days: [
          {
            date: '2026-10-09',
            hasActivity: true,
            dayTotal: null,
            amountKnown: false,
            currencyCode: 'INR',
            paymentStatus: null,
            slots: [
              { mealType: 'BREAKFAST', status: 'ACCEPTED' },
              { mealType: 'DINNER', status: 'ACCEPTED' },
            ],
          },
        ],
      } as unknown as MemberMealActivityMonth,
      '2026-10-10',
    );
    const summary = buildDayMealPaymentMonthSummary(items, '2026-10');
    expect(items[0]?.amount).toBeNull();
    expect(items[0]?.amountKnown).toBe(false);
    expect(summary.pendingAmount).toBeNull();
    expect(summary.pendingCount).toBe(1);
    expect(summary.totalAmount).toBeNull();
  });

  it('sums several pending days once and drops a paid day from the pending amount', () => {
    const items = buildDayMealPaymentListItems(
      {
        month: '2026-10',
        summary: { acceptedMeals: 3, pendingResponses: 0, skippedMeals: 0, currencyCode: 'INR' },
        days: [
          {
            date: '2026-10-01',
            dayTotal: 200,
            paymentStatus: 'PENDING',
            slots: [{ mealType: 'DINNER', status: 'ACCEPTED', slotAmount: 200 }],
          },
          {
            date: '2026-10-02',
            dayTotal: 300,
            paymentStatus: 'REJECTED',
            slots: [{ mealType: 'LUNCH', status: 'ACCEPTED', slotAmount: 300 }],
          },
          {
            date: '2026-10-03',
            dayTotal: 400,
            paymentStatus: 'PAID',
            slots: [{ mealType: 'BREAKFAST', status: 'ACCEPTED', slotAmount: 400 }],
          },
          {
            date: '2026-10-04',
            dayTotal: 150,
            paymentStatus: 'PENDING_APPROVAL',
            slots: [{ mealType: 'DINNER', status: 'ACCEPTED', slotAmount: 150 }],
          },
        ],
      } as unknown as MemberMealActivityMonth,
      '2026-10-10',
    );
    const october = buildDayMealPaymentMonthSummary(items, '2026-10');
    expect(october.pendingAmount).toBe(500);
    expect(october.pendingCount).toBe(2);
    expect(october.collectedAmount).toBe(400);
    expect(october.totalAmount).toBe(1050);
    const november = buildDayMealPaymentListItems(
      {
        month: '2026-11',
        summary: { acceptedMeals: 0, pendingResponses: 0, skippedMeals: 0, currencyCode: 'INR' },
        days: [],
      } as unknown as MemberMealActivityMonth,
      '2026-10-10',
    );
    expect(buildDayMealPaymentMonthSummary(november, '2026-11').pendingAmount).toBe(0);
    expect(buildDayMealPaymentMonthSummary(november, '2026-11').pendingCount).toBe(0);
  });

  it('opens under review when action needed is empty', () => {
    const items = buildDayMealPaymentListItems(activity, '2026-07-13').filter(
      item => item.displayStatus === 'PENDING_APPROVAL' || item.displayStatus === 'PAID',
    );
    expect(resolvePreferredDayMealPaymentsSection(items, 'actionNeeded')).toBe('underReview');
  });
});
