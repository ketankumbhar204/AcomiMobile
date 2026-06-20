/** ISO calendar date `YYYY-MM-DD` in local timezone. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** Negative if `a` is before `b`, zero if equal, positive if after. */
export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

/** True when the calendar date is strictly before today (local timezone). */
export function isPastMenuDate(isoDate: string): boolean {
  return compareIsoDates(isoDate, todayIsoDate()) < 0;
}

/** True when menus and polls for this date may be created or edited. */
export function isEditableMenuDate(isoDate: string): boolean {
  return !isPastMenuDate(isoDate);
}

export function tomorrowIsoDate(): string {
  return addDaysIsoDate(todayIsoDate(), 1);
}

export function yesterdayIsoDate(): string {
  return addDaysIsoDate(todayIsoDate(), -1);
}

export type RelativeMenuDateKind = 'today' | 'yesterday' | 'tomorrow';

/** When the date is today, yesterday, or tomorrow; otherwise null. */
export function relativeMenuDateKind(isoDate: string): RelativeMenuDateKind | null {
  const today = todayIsoDate();
  if (isoDate === today) {
    return 'today';
  }
  if (isoDate === yesterdayIsoDate()) {
    return 'yesterday';
  }
  if (isoDate === tomorrowIsoDate()) {
    return 'tomorrow';
  }
  return null;
}

export function relativeMenuDateLabelKey(kind: RelativeMenuDateKind): string {
  return `meals.dates.${kind}`;
}

export function headcountTitleKey(isoDate: string): string {
  const kind = relativeMenuDateKind(isoDate);
  switch (kind) {
    case 'today':
      return 'dashboard.headcount.titleToday';
    case 'yesterday':
      return 'dashboard.headcount.titleYesterday';
    case 'tomorrow':
      return 'dashboard.headcount.titleTomorrow';
    default:
      return 'dashboard.headcount.titleDate';
  }
}

export function headcountTitleUsesDateParam(isoDate: string): boolean {
  return relativeMenuDateKind(isoDate) == null;
}

export function addDaysIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function isoDateToMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function addMonthsToMonthKey(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMenuDate(isoDate: string, locale: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Compact date for sheet headers, e.g. "19 Jun 2026". */
export function formatMenuDateCompact(isoDate: string, locale: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatResponseDateParts(
  iso: string,
  locale: string,
): { date: string; time: string } | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return {
    date: parsed.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: parsed.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}
