import { parseSpaceLocalDateTime } from './pollCloseDisplay';

export type PollCloseSource = {
  status?: string | null;
  pollCloseAt?: unknown;
  poll_close_at?: unknown;
  timezone?: string | null;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

const DEFAULT_POLL_TIMEZONE = 'Asia/Kolkata';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Normalize API close times (ISO string, snake_case, or Jackson timestamp array). */
export function normalizePollCloseAt(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  if (Array.isArray(value) && value.length >= 5) {
    const [year, month, day, hour, minute, second = 0] = value.map(Number);
    if (![year, month, day, hour, minute, second].every(Number.isFinite)) {
      return null;
    }
    return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  }
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    const year = Number(rec.year ?? rec.y);
    const month = Number(rec.monthValue ?? rec.month);
    const day = Number(rec.dayOfMonth ?? rec.day);
    const hour = Number(rec.hour);
    const minute = Number(rec.minute);
    if (![year, month, day, hour, minute].every(Number.isFinite)) {
      return null;
    }
    const second = Number.isFinite(Number(rec.second)) ? Number(rec.second) : 0;
    return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  }
  return null;
}

function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asIfUtc - utcMs;
}

function wallClockInZoneToUtcMs(
  wall: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): number {
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, 0);
  const adjusted = asUtc - tzOffsetMs(asUtc, timeZone);
  return asUtc - tzOffsetMs(adjusted, timeZone);
}

function resolveTimezone(timezone?: string | null): string {
  const trimmed = timezone?.trim();
  return trimmed ? trimmed : DEFAULT_POLL_TIMEZONE;
}

/** Instant for a poll close time. Naive LocalDateTime is space wall clock, not UTC. */
export function pollCloseAtToEpochMs(
  closeAt: string,
  timezone?: string | null,
): number {
  const normalized = normalizePollCloseAt(closeAt);
  if (!normalized) {
    return Number.NaN;
  }
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
    return Date.parse(normalized);
  }
  const parsed = parseSpaceLocalDateTime(normalized);
  if (!parsed) {
    return Date.parse(normalized);
  }
  try {
    return wallClockInZoneToUtcMs(parsed, resolveTimezone(timezone));
  } catch {
    return Date.parse(normalized);
  }
}

export function timezoneForPollClose(
  polls: PollCloseSource[],
  closeAt: string | null,
): string | null {
  if (!closeAt) {
    return null;
  }
  const match = polls.find(
    poll => normalizePollCloseAt(poll.pollCloseAt ?? poll.poll_close_at) === closeAt,
  );
  return match?.timezone ?? polls.find(poll => poll.timezone)?.timezone ?? null;
}

/** Earliest close time among still-open polls (same rule as the meal poll page). */
export function earliestOpenPollCloseAt(polls: PollCloseSource[]): string | null {
  const times = polls
    .filter(poll => String(poll.status ?? '').toUpperCase() === 'OPEN')
    .map(poll => normalizePollCloseAt(poll.pollCloseAt ?? poll.poll_close_at))
    .filter((value): value is string => Boolean(value))
    .sort();
  return times[0] ?? null;
}

export function formatPollDeadline(
  closeAt: string,
  locale?: string,
  timezone?: string | null,
): string {
  const ms = pollCloseAtToEpochMs(closeAt, timezone);
  if (!Number.isFinite(ms)) {
    return closeAt;
  }
  try {
    return new Date(ms).toLocaleString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: resolveTimezone(timezone),
    });
  } catch {
    return closeAt;
  }
}

function remainingParts(closeAt: string, nowMs: number, timezone?: string | null) {
  const ms = pollCloseAtToEpochMs(closeAt, timezone) - nowMs;
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return { hours, minutes };
}

/** Large remaining value: `2h 23m`. */
export function formatPollRemaining(
  closeAt: string | null | undefined,
  t: Translate,
  nowMs = Date.now(),
  timezone?: string | null,
): string | null {
  if (!closeAt) {
    return null;
  }
  const parts = remainingParts(closeAt, nowMs, timezone);
  if (!parts) {
    return t('meals.poll.closingSoon', { defaultValue: 'Closing soon' });
  }
  const { hours, minutes } = parts;
  if (hours >= 24) {
    return t('meals.poll.remainingDays', {
      defaultValue: '{{count}}d',
      count: Math.floor(hours / 24),
    });
  }
  if (hours > 0) {
    return t('meals.poll.remainingHoursMinutes', {
      defaultValue: '{{hours}}h {{minutes}}m',
      hours,
      minutes,
    });
  }
  return t('meals.poll.remainingMinutes', {
    defaultValue: '{{count}}m',
    count: Math.max(minutes, 1),
  });
}

/** Compact chip: `Closes in 2h 23m`. */
export function formatPollClosesIn(
  closeAt: string | null | undefined,
  t: Translate,
  nowMs = Date.now(),
  timezone?: string | null,
): string | null {
  if (!closeAt) {
    return null;
  }
  const parts = remainingParts(closeAt, nowMs, timezone);
  if (!parts) {
    return t('meals.poll.closingSoon', { defaultValue: 'Closing soon' });
  }
  const { hours, minutes } = parts;
  if (hours >= 24) {
    return t('meals.poll.closesInDays', {
      defaultValue: 'Closes in {{count}}d',
      count: Math.floor(hours / 24),
    });
  }
  if (hours > 0) {
    return t('meals.poll.closesInHoursMinutes', {
      defaultValue: 'Closes in {{hours}}h {{minutes}}m',
      hours,
      minutes,
    });
  }
  return t('meals.poll.closesInMinutes', {
    defaultValue: 'Closes in {{count}}m',
    count: Math.max(minutes, 1),
  });
}
