import { paymentListEmptyKind, shouldShowMonthPayments } from '../paymentMonthList';

describe('payment month list', () => {
  it('shows a month that has a pending payment', () => {
    expect(
      paymentListEmptyKind({
        selectedMonth: '2026-09',
        loadedMonth: '2026-09',
        pendingAmount: 3166.67,
        recordCount: 1,
        visibleCount: 1,
        preset: 'pending',
      }),
    ).toBe('none');
  });

  it('does not call a non-zero pending month clear of dues', () => {
    expect(
      paymentListEmptyKind({
        selectedMonth: '2026-10',
        loadedMonth: '2026-10',
        pendingAmount: 5000,
        recordCount: 0,
        visibleCount: 0,
        preset: 'pending',
      }),
    ).toBe('mismatch');
  });

  it('uses the clear empty state only when the month has no outstanding balance', () => {
    expect(
      paymentListEmptyKind({
        selectedMonth: '2026-11',
        loadedMonth: '2026-11',
        pendingAmount: 0,
        recordCount: 0,
        visibleCount: 0,
        preset: 'pending',
      }),
    ).toBe('pending');
  });

  it('keeps an overdue charge on the month it was loaded for', () => {
    expect(shouldShowMonthPayments('2026-10', '2026-09')).toBe(false);
    expect(
      paymentListEmptyKind({
        selectedMonth: '2026-10',
        loadedMonth: '2026-09',
        pendingAmount: 3166.67,
        recordCount: 1,
        visibleCount: 1,
        preset: 'pending',
      }),
    ).toBe('loading');
  });

  it('drops the previous month while the next month is still loading', () => {
    const selected = ['2026-09', '2026-10', '2026-09'];
    const visible = selected.map((month, index) =>
      shouldShowMonthPayments(month, index === selected.length - 1 ? month : null),
    );
    expect(visible).toEqual([false, false, true]);
  });
});
