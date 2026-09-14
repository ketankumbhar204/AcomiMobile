import {
  earliestOpenPollCloseAt,
  formatPollClosesIn,
  formatPollDeadline,
  formatPollRemaining,
  normalizePollCloseAt,
  pollCloseAtToEpochMs,
} from '../pollCountdown';

describe('pollCountdown', () => {
  const now = Date.parse('2026-09-08T21:21:00+05:30');

  it('picks the earliest open poll close time', () => {
    expect(
      earliestOpenPollCloseAt([
        { status: 'CLOSED', pollCloseAt: '2026-09-08T18:00:00' },
        { status: 'OPEN', pollCloseAt: '2026-09-08T23:44:00' },
        { status: 'OPEN', pollCloseAt: '2026-09-08T22:00:00' },
      ]),
    ).toBe('2026-09-08T22:00:00');
  });

  it('reads snake_case and Jackson array close times', () => {
    expect(
      earliestOpenPollCloseAt([
        { status: 'OPEN', poll_close_at: [2026, 9, 8, 22, 0, 0] },
      ]),
    ).toBe('2026-09-08T22:00:00');
    expect(normalizePollCloseAt([2026, 9, 8, 23, 44])).toBe('2026-09-08T23:44:00');
  });

  it('formats remaining hours and minutes', () => {
    const t = (_key: string, options?: Record<string, unknown>) =>
      `${options?.hours}h ${options?.minutes}m`;
    expect(formatPollRemaining('2026-09-08T23:44:00+05:30', t, now)).toBe('2h 23m');
    expect(formatPollClosesIn('2026-09-08T23:44:00+05:30', t, now)).toBe('2h 23m');
  });

  it('treats naive LocalDateTime as space wall clock, not UTC', () => {
    const t = (_key: string, options?: Record<string, unknown>) =>
      `${options?.hours}h ${options?.minutes}m`;
    expect(
      formatPollRemaining('2026-09-08T23:44:00', t, now, 'Asia/Kolkata'),
    ).toBe('2h 23m');
    const ms = pollCloseAtToEpochMs('2026-09-08T23:44:00', 'Asia/Kolkata');
    expect(ms).toBe(Date.parse('2026-09-08T23:44:00+05:30'));
  });

  it('returns a deadline label', () => {
    const label = formatPollDeadline('2026-09-08T23:44:00', 'en-IN', 'Asia/Kolkata');
    expect(label.toLowerCase()).toContain('sep');
  });
});
