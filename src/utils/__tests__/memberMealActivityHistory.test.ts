import {
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
