import {
  addDaysIsoDate,
  compareIsoDates,
  splitMenuDateRange,
  headcountTitleKey,
  headcountTitleUsesDateParam,
  isEditableMenuDate,
  isPastMenuDate,
  relativeMenuDateKind,
  todayIsoDate,
} from '../mealDates';

describe('mealDates', () => {
  const today = todayIsoDate();

  it('compareIsoDates orders calendar strings', () => {
    expect(compareIsoDates('2026-06-20', '2026-06-21')).toBeLessThan(0);
    expect(compareIsoDates('2026-06-21', '2026-06-21')).toBe(0);
    expect(compareIsoDates('2026-06-22', '2026-06-21')).toBeGreaterThan(0);
  });

  it('isPastMenuDate is false for today and future', () => {
    expect(isPastMenuDate(today)).toBe(false);
    expect(isPastMenuDate('2099-12-31')).toBe(false);
  });

  it('isPastMenuDate is true for dates before today', () => {
    const [year, month, day] = today.split('-').map(Number);
    const yesterday = new Date(year, month - 1, day - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d = String(yesterday.getDate()).padStart(2, '0');
    expect(isPastMenuDate(`${y}-${m}-${d}`)).toBe(true);
  });

  it('isEditableMenuDate mirrors isPastMenuDate', () => {
    expect(isEditableMenuDate(today)).toBe(true);
    expect(isEditableMenuDate('2000-01-01')).toBe(false);
  });

  it('relativeMenuDateKind identifies today, yesterday, and tomorrow', () => {
    expect(relativeMenuDateKind(today)).toBe('today');
    expect(relativeMenuDateKind(addDaysIsoDate(today, -1))).toBe('yesterday');
    expect(relativeMenuDateKind(addDaysIsoDate(today, 1))).toBe('tomorrow');
    expect(relativeMenuDateKind(addDaysIsoDate(today, -2))).toBeNull();
  });

  it('splits a 90-day copy-menu range into 31-day windows', () => {
    const windows = splitMenuDateRange('2026-07-30', '2026-10-27');
    expect(windows[0]?.from).toBe('2026-07-30');
    expect(windows[windows.length - 1]?.to).toBe('2026-10-27');
    expect(windows.length).toBeGreaterThan(1);
    for (let index = 0; index < windows.length; index += 1) {
      const window = windows[index];
      const start = new Date(`${window.from}T12:00:00`);
      const end = new Date(`${window.to}T12:00:00`);
      const inclusive = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
      expect(inclusive).toBeLessThanOrEqual(31);
      expect(inclusive).toBeGreaterThan(0);
      if (index > 0) {
        expect(window.from).toBe(addDaysIsoDate(windows[index - 1].to, 1));
      }
    }
    expect(splitMenuDateRange('2026-10-01', '2026-10-31')).toEqual([
      { from: '2026-10-01', to: '2026-10-31' },
    ]);
    expect(splitMenuDateRange('2026-10-28', '2026-10-27')).toEqual([
      { from: '2026-10-28', to: '2026-10-27' },
    ]);
  });

  it('headcountTitleKey matches relative date', () => {
    expect(headcountTitleKey(today)).toBe('dashboard.headcount.titleToday');
    expect(headcountTitleKey(addDaysIsoDate(today, -2))).toBe('dashboard.headcount.titleDate');
    expect(headcountTitleUsesDateParam(addDaysIsoDate(today, -2))).toBe(true);
    expect(headcountTitleUsesDateParam(today)).toBe(false);
  });
});
