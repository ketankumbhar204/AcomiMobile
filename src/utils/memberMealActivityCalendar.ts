import type { MemberMealActivityDay, MemberMealActivitySlotStatus } from '../api/types';
import { colors } from '../theme';

/** Whether a calendar day can be opened for detail. */
export function dayHasActivity(day: MemberMealActivityDay | undefined): boolean {
  if (!day) {
    return false;
  }
  const slots = day.slots ?? [];
  return slots.some(
    slot =>
      slot.status === 'ACCEPTED' ||
      slot.status === 'PENDING' ||
      slot.status === 'SKIPPED',
  );
}

/** Normalize API date values (string, array, or ISO datetime) to YYYY-MM-DD. */
export function normalizeActivityDate(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    return trimmed || null;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

export const MEAL_ACTIVITY_SLOT_COLORS: Record<MemberMealActivitySlotStatus, string> = {
  ACCEPTED: colors.success,
  PENDING: '#EAB308',
  SKIPPED: '#EF4444',
  NO_MENU: '#9CA3AF',
  INACTIVE: '#E5E7EB',
};

export function buildCalendarWeeks(monthKey: string): (string | null)[][] {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = firstDay.getDay();

  const cells: (string | null)[] = [];
  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function formatMonthLabel(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
