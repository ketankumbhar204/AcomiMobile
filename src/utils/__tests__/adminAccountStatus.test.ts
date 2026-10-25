import {
  describeAdminAccountActivity,
  formatActivityFact,
  type ActivityLabels,
} from '../adminAccountStatus';

const labels: ActivityLabels = {
  never: 'Never',
  unknown: 'Not recorded',
  justNow: 'Just now',
  minutesAgo: count => `${count} min ago`,
  hoursAgo: count => `${count} hr ago`,
  daysAgo: count => `${count} days ago`,
};

const now = new Date('2026-10-17T18:16:00+05:30');

describe('admin account activity', () => {
  it('keeps a deactivated verified onboarded account deactivated', () => {
    const activity = describeAdminAccountActivity({
      active: false,
      activityTracked: true,
      lastActiveAt: null,
      lastLoginAt: null,
      now,
    });

    expect(activity.status).toBe('deactivated');
    expect(formatActivityFact(activity.lastActive, labels)).toBe('Never');
    expect(formatActivityFact(activity.lastLogin, labels)).toBe('Never');
  });

  it('does not treat a missing active flag as enabled', () => {
    const activity = describeAdminAccountActivity({
      active: undefined,
      activityTracked: true,
      now,
    });

    expect(activity.status).toBe('unknown');
  });

  it('shows never only when tracking covers the account and nothing was recorded', () => {
    const tracked = describeAdminAccountActivity({
      active: true,
      activityTracked: true,
      lastActiveAt: null,
      lastLoginAt: null,
      now,
    });
    const unknown = describeAdminAccountActivity({
      active: true,
      activityTracked: false,
      lastActiveAt: null,
      lastLoginAt: null,
      now,
    });

    expect(formatActivityFact(tracked.lastActive, labels)).toBe('Never');
    expect(formatActivityFact(tracked.lastLogin, labels)).toBe('Never');
    expect(formatActivityFact(unknown.lastActive, labels)).toBe('Not recorded');
    expect(formatActivityFact(unknown.lastLogin, labels)).toBe('Not recorded');
  });

  it('does not call a previous login a current session or online state', () => {
    const activity = describeAdminAccountActivity({
      active: true,
      activityTracked: true,
      lastLoginAt: '2026-10-17T17:16:00+05:30',
      lastActiveAt: '2026-10-17T17:16:00+05:30',
      now,
    });

    expect(activity.status).toBe('active');
    expect(formatActivityFact(activity.lastActive, labels)).toBe(
      '1 hr ago\n17 Oct 2026, 5:16 pm GMT+5:30',
    );
    expect(formatActivityFact(activity.lastLogin, labels)).toBe(
      '1 hr ago\n17 Oct 2026, 5:16 pm GMT+5:30',
    );
    expect(JSON.stringify(activity)).not.toMatch(/online|session/i);
  });

  it('keeps last login unknown when use was seen without a sign-in time', () => {
    const activity = describeAdminAccountActivity({
      active: true,
      activityTracked: true,
      lastActiveAt: '2026-10-17T18:15:30+05:30',
      lastLoginAt: null,
      now,
    });

    expect(formatActivityFact(activity.lastActive, labels)).toBe(
      'Just now\n17 Oct 2026, 6:15 pm GMT+5:30',
    );
    expect(formatActivityFact(activity.lastLogin, labels)).toBe('Not recorded');
  });

  it('rejects an unparseable timestamp instead of showing never', () => {
    const activity = describeAdminAccountActivity({
      active: true,
      activityTracked: true,
      lastActiveAt: 'not-a-date',
      lastLoginAt: null,
      now,
    });

    expect(activity.lastActive.presence).toBe('unknown');
    expect(activity.lastLogin.presence).toBe('never');
  });
});
