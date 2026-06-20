import {
  addDaysIsoDate,
  compareIsoDates,
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

  it('headcountTitleKey matches relative date', () => {
    expect(headcountTitleKey(today)).toBe('dashboard.headcount.titleToday');
    expect(headcountTitleKey(addDaysIsoDate(today, -2))).toBe('dashboard.headcount.titleDate');
    expect(headcountTitleUsesDateParam(addDaysIsoDate(today, -2))).toBe(true);
    expect(headcountTitleUsesDateParam(today)).toBe(false);
  });
});
