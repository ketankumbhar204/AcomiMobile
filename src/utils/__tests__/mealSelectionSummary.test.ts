import {
  buildMealSummaryFromActivityMonth,
  buildMealSummaryFromDayDetails,
  buildMealSummaryFromDraftSelections,
  buildMealSummaryFromPolls,
  countMealSummaryDays,
  displayMealPaymentTitle,
  ensureDayMealSections,
  mealPaymentListSubtitle,
  sumMealDaySections,
} from '../mealSelectionSummary';
import type { MealPollSlot, MemberMealActivityMonth } from '../../api/types';

describe('mealSelectionSummary', () => {
  it('builds poll summary with meal subtotals', () => {
    const polls: MealPollSlot[] = [
      {
        id: '1',
        mealType: 'BREAKFAST',
        status: 'OPEN',
        mySelectedOptionId: null,
        mySelections: [],
        options: [],
      } as unknown as MealPollSlot,
      {
        id: '2',
        mealType: 'LUNCH',
        status: 'OPEN',
        mySelectedOptionId: null,
        mySelections: [
          { optionId: 'a', quantity: 1 },
          { optionId: 'b', quantity: 1 },
        ],
        options: [
          {
            id: 'a',
            label: 'Chicken Thali',
            optionType: 'MENU_ENTRY',
            price: 100,
            currencyCode: 'INR',
          },
          {
            id: 'b',
            label: 'Dal Rice Combo',
            optionType: 'MENU_ENTRY',
            price: 50,
            currencyCode: 'INR',
          },
        ],
      } as unknown as MealPollSlot,
      {
        id: '3',
        mealType: 'DINNER',
        status: 'OPEN',
        mySelectedOptionId: null,
        mySelections: [{ optionId: 'c', quantity: 1 }],
        options: [
          {
            id: 'c',
            label: 'Boiled Egg',
            optionType: 'MENU_ENTRY',
            price: 30,
            currencyCode: 'INR',
          },
        ],
      } as unknown as MealPollSlot,
    ];

    const model = buildMealSummaryFromPolls(polls, true);
    expect(model.totalPlates).toBe(3);
    expect(model.totalAmount).toBe(180);
    expect(model.sections.find(s => s.mealType === 'BREAKFAST')?.items).toHaveLength(0);
    expect(model.sections.find(s => s.mealType === 'LUNCH')?.subtotal).toBe(150);
  });

  it('splits multi-item selection labels from month activity', () => {
    const activity: MemberMealActivityMonth = {
      month: '2026-07',
      summary: {
        acceptedMeals: 3,
        pendingResponses: 0,
        skippedMeals: 0,
        amountGenerated: 180,
        currencyCode: 'INR',
      },
      days: [
        {
          date: '2026-07-12',
          dayTotal: 180,
          currencyCode: 'INR',
          slots: [
            { mealType: 'BREAKFAST', status: 'SKIPPED' },
            {
              mealType: 'LUNCH',
              status: 'ACCEPTED',
              selectionLabel: 'Chicken Thali, Dal Rice Combo',
              quantity: 2,
              slotAmount: 150,
              currencyCode: 'INR',
            },
            {
              mealType: 'DINNER',
              status: 'ACCEPTED',
              selectionLabel: 'Boiled Egg',
              quantity: 1,
              slotAmount: 30,
              currencyCode: 'INR',
            },
          ],
        },
      ],
    };

    const model = buildMealSummaryFromActivityMonth(activity);
    expect(model?.sections.find(s => s.mealType === 'LUNCH')?.items).toHaveLength(2);
    expect(model?.totalAmount).toBe(180);
    expect(
      mealPaymentListSubtitle(
        model!,
        count => `${count} plates`,
        mealType => mealType,
      ),
    ).toContain('LUNCH');
  });

  it('builds per-item prices from day details', () => {
    const model = buildMealSummaryFromDayDetails([
      {
        date: '2026-07-12',
        dayTotal: 180,
        currencyCode: 'INR',
        slots: [
          {
            mealType: 'LUNCH',
            status: 'ACCEPTED',
            menuPublished: true,
            slotTotal: 150,
            selections: [
              {
                label: 'Chicken Thali',
                price: 100,
                currencyCode: 'INR',
                quantity: 1,
                lineTotal: 100,
              },
              {
                label: 'Dal Rice Combo',
                price: 50,
                currencyCode: 'INR',
                quantity: 1,
                lineTotal: 50,
              },
            ],
          },
          {
            mealType: 'DINNER',
            status: 'ACCEPTED',
            menuPublished: true,
            slotTotal: 30,
            selections: [
              {
                label: 'Boiled Egg',
                price: 30,
                currencyCode: 'INR',
                quantity: 1,
                lineTotal: 30,
              },
            ],
          },
        ],
      },
    ]);

    const lunch = model?.sections.find(s => s.mealType === 'LUNCH');
    expect(lunch?.items[0]?.unitPrice).toBe(100);
    expect(lunch?.items[0]?.lineAmount).toBe(100);
    expect(lunch?.items[1]?.unitPrice).toBe(50);
    expect(model?.totalAmount).toBe(180);
  });

  it('uses payment-centric meal titles without embedding the month', () => {
    expect(displayMealPaymentTitle('Meals — July 2026', '2026-07', () => 'July 2026')).toBe(
      'Meal Payment',
    );
    expect(displayMealPaymentTitle('Meal Charges — July 2026')).toBe('Meal Payment');
  });

  it('fills missing meal slots for a day and sums daily totals', () => {
    const sections = ensureDayMealSections(
      [
        {
          mealType: 'BREAKFAST',
          date: '2026-07-12',
          items: [{ label: 'Idli', quantity: 1, lineAmount: 40 }],
          subtotal: 40,
          currencyCode: 'INR',
        },
        {
          mealType: 'LUNCH',
          date: '2026-07-12',
          items: [{ label: 'Thali', quantity: 1, lineAmount: 100 }],
          subtotal: 100,
          currencyCode: 'INR',
        },
      ],
      '2026-07-12',
    );

    expect(sections.map(s => s.mealType)).toEqual(['BREAKFAST', 'LUNCH', 'DINNER']);
    expect(sections[2].items).toEqual([]);
    expect(sumMealDaySections(sections)).toBe(140);
    expect(
      countMealSummaryDays({
        sections,
        totalPlates: 2,
        totalAmount: 140,
        currencyCode: 'INR',
        selectedMealTypes: ['BREAKFAST', 'LUNCH'],
      }),
    ).toBe(1);
  });

  it('builds draft selection summary for payment review', () => {
    const polls: MealPollSlot[] = [
      {
        id: '1',
        mealType: 'BREAKFAST',
        status: 'OPEN',
        options: [
          {
            id: 'egg',
            label: 'Boiled Egg',
            optionType: 'MENU_ENTRY',
            price: 30,
            currencyCode: 'INR',
          },
        ],
      } as unknown as MealPollSlot,
      {
        id: '2',
        mealType: 'LUNCH',
        status: 'OPEN',
        options: [
          {
            id: 'thali',
            label: 'Chicken Thali',
            optionType: 'MENU_ENTRY',
            price: 100,
            currencyCode: 'INR',
          },
        ],
      } as unknown as MealPollSlot,
      {
        id: '3',
        mealType: 'DINNER',
        status: 'OPEN',
        options: [
          {
            id: 'dal',
            label: 'Dal Rice Combo',
            optionType: 'MENU_ENTRY',
            price: 50,
            currencyCode: 'INR',
          },
        ],
      } as unknown as MealPollSlot,
    ];

    const model = buildMealSummaryFromDraftSelections(
      polls,
      true,
      {},
      {
        BREAKFAST: { egg: 1 },
        LUNCH: { thali: 1 },
      },
      { BREAKFAST: 'loc-1' },
      [{ id: 'loc-1', name: 'Hall A', active: true, sortOrder: 0 }],
    );

    expect(model.totalPlates).toBe(2);
    expect(model.totalAmount).toBe(130);
    expect(model.sections.find(s => s.mealType === 'DINNER')?.items).toHaveLength(0);
    expect(model.sections.find(s => s.mealType === 'BREAKFAST')?.deliveryLocationName).toBe(
      'Hall A',
    );
  });
});
