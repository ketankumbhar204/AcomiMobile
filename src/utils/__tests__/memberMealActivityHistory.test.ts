import {
  activityDayPollClosed,
  canChooseActivityMeals,
  filterActivityDays,
  formatSlotLine,
  resolveActivityPaymentDisplay,
} from '../memberMealActivityHistory';
import type { MemberMealActivityDay } from '../../api/types';

function day(
  date: string,
  overrides: Partial<MemberMealActivityDay> = {},
): MemberMealActivityDay {
  return {
    date,
    dayTotal: 530,
    currencyCode: 'INR',
    paymentStatus: null,
    slots: [
      {
        mealType: 'LUNCH',
        status: 'ACCEPTED',
        selectionLabel: 'Thali',
        quantity: 1,
        slotAmount: 530,
        currencyCode: 'INR',
      },
    ],
    ...overrides,
  };
}

describe('resolveActivityPaymentDisplay', () => {
  it('shows Under review for PENDING_APPROVAL instead of Pending/Overdue', () => {
    expect(
      resolveActivityPaymentDisplay(
        day('2026-07-13', { paymentStatus: 'PENDING_APPROVAL' }),
        '2026-07-19',
      ),
    ).toBe('IN_REVIEW');
  });

  it('shows Paid when payment is PAID', () => {
    expect(
      resolveActivityPaymentDisplay(day('2026-07-12', { paymentStatus: 'PAID' }), '2026-07-19'),
    ).toBe('PAID');
  });

  it('shows Overdue for unpaid past days', () => {
    expect(
      resolveActivityPaymentDisplay(day('2026-07-13', { paymentStatus: 'PENDING' }), '2026-07-19'),
    ).toBe('OVERDUE');
  });
});

describe('formatSlotLine', () => {
  const labels: Record<string, string> = {
    ACCEPTED: 'Accepted',
    PENDING: 'Pending response',
    SKIPPED: 'Skipped',
    NO_MENU: 'No menu published',
    INACTIVE: 'Inactive',
  };

  it('shows the saved selection instead of a pending label', () => {
    expect(
      formatSlotLine(
        {
          mealType: 'BREAKFAST',
          status: 'ACCEPTED',
          selectionLabel: 'Idli',
          quantity: 1,
        },
        status => labels[status],
      ).detail,
    ).toBe('Idli ×1');
  });

  it('labels a published menu with no response as pending', () => {
    expect(
      formatSlotLine(
        { mealType: 'LUNCH', status: 'PENDING' },
        status => labels[status],
      ).detail,
    ).toBe('Pending response');
  });

  it('labels a skip separately from an unanswered meal', () => {
    expect(
      formatSlotLine(
        { mealType: 'DINNER', status: 'SKIPPED' },
        status => labels[status],
      ).detail,
    ).toBe('Skipped');
  });

  it('shows Not selected for a planned menu with no choice on a closed poll', () => {
    expect(
      formatSlotLine(
        { mealType: 'BREAKFAST', status: 'PENDING', pollStatus: 'CLOSED' },
        status => labels[status],
        'Not selected',
      ).detail,
    ).toBe('Not selected');
  });

  it('keeps a saved selection when the poll is closed', () => {
    expect(
      formatSlotLine(
        {
          mealType: 'LUNCH',
          status: 'ACCEPTED',
          pollStatus: 'CLOSED',
          selectionLabel: 'Thali',
          quantity: 1,
        },
        status => labels[status],
        'Poll Closed',
      ).detail,
    ).toBe('Thali ×1');
  });
});

describe('meal poll choice availability', () => {
  it('hides meal choice for a past closed day', () => {
    const slots = [
      { status: 'PENDING' as const, pollStatus: 'CLOSED' as const },
      { status: 'PENDING' as const, pollStatus: 'CLOSED' as const },
    ];
    expect(canChooseActivityMeals(slots)).toBe(false);
    expect(activityDayPollClosed(slots)).toBe(true);
  });

  it('allows choice while the current poll is still open', () => {
    const slots = [{ status: 'PENDING' as const, pollStatus: 'OPEN' as const }];
    expect(canChooseActivityMeals(slots)).toBe(true);
    expect(activityDayPollClosed(slots)).toBe(false);
  });

  it('blocks choice after the current poll deadline', () => {
    const slots = [{ status: 'PENDING' as const, pollStatus: 'CLOSED' as const }];
    expect(canChooseActivityMeals(slots)).toBe(false);
    expect(activityDayPollClosed(slots)).toBe(true);
  });

  it('keeps future open polls choosable', () => {
    const slots = [{ status: 'PENDING' as const, pollStatus: 'OPEN' as const }];
    expect(canChooseActivityMeals(slots)).toBe(true);
  });

  it('still allows choice when only some meals are closed', () => {
    const slots = [
      { status: 'PENDING' as const, pollStatus: 'CLOSED' as const },
      { status: 'PENDING' as const, pollStatus: 'OPEN' as const },
    ];
    expect(canChooseActivityMeals(slots)).toBe(true);
    expect(activityDayPollClosed(slots)).toBe(false);
  });
});

describe('filterActivityDays sort', () => {
  const days = [day('2026-07-11'), day('2026-07-13'), day('2026-07-12')];

  it('sorts newest first by default', () => {
    expect(filterActivityDays(days, 'ALL', '2026-07-19').map(d => d.date)).toEqual([
      '2026-07-13',
      '2026-07-12',
      '2026-07-11',
    ]);
  });

  it('sorts oldest first when ascending', () => {
    expect(filterActivityDays(days, 'ALL', '2026-07-19', 'asc').map(d => d.date)).toEqual([
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
    ]);
  });
});
