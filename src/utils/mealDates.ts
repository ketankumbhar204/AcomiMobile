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

export function tomorrowIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}

export function addDaysIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
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
