export type PollCloseLabelCopy = {
  today?: string;
  tomorrow?: string;
  yesterday?: string;
  am?: string;
  pm?: string;
};

/**
 * Format poll close / closed timestamps for Menu Planning (space timezone aware).
 * Pass localized day/AM-PM labels from i18n when available.
 */
export function formatPollCloseLabel(
  isoLocalDateTime: string | null | undefined,
  timezone: string | null | undefined,
  language = 'en',
  copy: PollCloseLabelCopy = {},
): string {
  if (!isoLocalDateTime) {
    return '';
  }
  const parsed = parseSpaceLocalDateTime(isoLocalDateTime);
  if (!parsed) {
    return isoLocalDateTime;
  }

  const zone = timezone && timezone.trim() ? timezone.trim() : 'Asia/Kolkata';
  const now = nowInTimeZone(zone);
  const timeLabel = formatTime12h(parsed.hour, parsed.minute, copy.am, copy.pm);
  const today = copy.today ?? 'Today';
  const tomorrowLabel = copy.tomorrow ?? 'Tomorrow';
  const yesterdayLabel = copy.yesterday ?? 'Yesterday';

  if (isSameCalendarDay(parsed, now)) {
    return `${today} ${timeLabel}`;
  }
  const tomorrow = addCalendarDays(now, 1);
  if (isSameCalendarDay(parsed, tomorrow)) {
    return `${tomorrowLabel} ${timeLabel}`;
  }
  const yesterday = addCalendarDays(now, -1);
  if (isSameCalendarDay(parsed, yesterday)) {
    return `${yesterdayLabel} ${timeLabel}`;
  }

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date);
  const monthDay = new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
  }).format(date);
  return `${weekday}, ${monthDay} · ${timeLabel}`;
}

type YmdHm = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** Parse backend LocalDateTime (`2026-07-11T20:00:00` or with seconds). */
export function parseSpaceLocalDateTime(value: string): YmdHm | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?/);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

export function toPollCloseAtPayload(dateIso: string, hour: number, minute: number): string {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${dateIso}T${hh}:${mm}:00`;
}

function formatTime12h(
  hour: number,
  minute: number,
  am = 'AM',
  pm = 'PM',
): string {
  const suffix = hour >= 12 ? pm : am;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, '0');
  return `${h12}:${mm} ${suffix}`;
}

function nowInTimeZone(timeZone: string): YmdHm {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

function isSameCalendarDay(a: YmdHm, b: YmdHm): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function addCalendarDays(base: YmdHm, days: number): YmdHm {
  const utc = new Date(Date.UTC(base.year, base.month - 1, base.day + days, 12, 0, 0));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    hour: base.hour,
    minute: base.minute,
  };
}
