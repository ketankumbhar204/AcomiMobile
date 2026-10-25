/** ACOMI records account activity in India Standard Time. */
export const ACOMI_TIME_ZONE = 'Asia/Kolkata';

export type AccountStatus = 'active' | 'deactivated' | 'unknown';

export type RelativeAge =
  | { kind: 'justNow' }
  | { kind: 'minutes'; count: number }
  | { kind: 'hours'; count: number }
  | { kind: 'days'; count: number };

export type ActivityFact =
  | { presence: 'timestamp'; at: string; relative: RelativeAge; exact: string }
  | { presence: 'never' }
  | { presence: 'unknown' };

export interface AdminAccountActivityInput {
  active?: boolean | null;
  activityTracked?: boolean | null;
  lastActiveAt?: string | null;
  lastLoginAt?: string | null;
  now?: Date;
}

export interface AdminAccountActivity {
  status: AccountStatus;
  lastActive: ActivityFact;
  lastLogin: ActivityFact;
}

export interface ActivityLabels {
  never: string;
  unknown: string;
  justNow: string;
  minutesAgo: (count: number) => string;
  hoursAgo: (count: number) => string;
  daysAgo: (count: number) => string;
}

const EXACT_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: ACOMI_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZoneName: 'short',
};

export function formatAcomiDateTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat('en-GB', EXACT_FORMAT).format(date);
}

function hasInstant(iso: string | null | undefined): boolean {
  return Boolean(iso) && !Number.isNaN(Date.parse(iso as string));
}

function relativeAge(at: Date, now: Date): RelativeAge {
  const deltaMs = now.getTime() - at.getTime();
  if (deltaMs < 60_000) {
    return { kind: 'justNow' };
  }
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) {
    return { kind: 'minutes', count: minutes };
  }
  const hours = Math.floor(deltaMs / 3_600_000);
  if (hours < 24) {
    return { kind: 'hours', count: hours };
  }
  return { kind: 'days', count: Math.max(Math.floor(deltaMs / 86_400_000), 1) };
}

function describeMoment(
  iso: string | null | undefined,
  activityTracked: boolean,
  otherMomentRecorded: boolean,
  now: Date,
): ActivityFact {
  if (iso != null && iso.trim() !== '') {
    const exact = formatAcomiDateTime(iso);
    if (!exact) {
      return { presence: 'unknown' };
    }
    return {
      presence: 'timestamp',
      at: iso,
      relative: relativeAge(new Date(iso), now),
      exact,
    };
  }
  if (otherMomentRecorded || !activityTracked) {
    return { presence: 'unknown' };
  }
  return { presence: 'never' };
}

/**
 * Account enablement, last use, and last sign-in.
 * Verification and onboarding are not inputs. A missing timestamp is "never" only when
 * activity tracking already covers the account and no related moment was recorded.
 */
export function describeAdminAccountActivity(
  input: AdminAccountActivityInput,
): AdminAccountActivity {
  const now = input.now ?? new Date();
  const tracked = input.activityTracked === true;
  const status: AccountStatus =
    input.active === true ? 'active' : input.active === false ? 'deactivated' : 'unknown';
  return {
    status,
    lastActive: describeMoment(input.lastActiveAt, tracked, hasInstant(input.lastLoginAt), now),
    lastLogin: describeMoment(input.lastLoginAt, tracked, hasInstant(input.lastActiveAt), now),
  };
}

export function formatActivityFact(fact: ActivityFact, labels: ActivityLabels): string {
  if (fact.presence === 'never') {
    return labels.never;
  }
  if (fact.presence === 'unknown') {
    return labels.unknown;
  }
  const relative =
    fact.relative.kind === 'justNow'
      ? labels.justNow
      : fact.relative.kind === 'minutes'
        ? labels.minutesAgo(fact.relative.count)
        : fact.relative.kind === 'hours'
          ? labels.hoursAgo(fact.relative.count)
          : labels.daysAgo(fact.relative.count);
  return `${relative}\n${fact.exact}`;
}
