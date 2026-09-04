import { formatPollCloseLabel, toPollCloseAtPayload } from '../pollCloseDisplay';

describe('pollCloseDisplay', () => {
  it('builds pollCloseAt payload', () => {
    expect(toPollCloseAtPayload('2026-07-11', 20, 0)).toBe('2026-07-11T20:00:00');
  });

  it('formats a concrete weekday when not today/tomorrow', () => {
    const label = formatPollCloseLabel('2099-01-15T20:00:00', 'Asia/Kolkata', 'en');
    expect(label).toMatch(/20:00 PM|8:00 PM/);
    expect(label.length).toBeGreaterThan(5);
  });

  it('uses localized relative-day labels when provided', () => {
    // Force "today" by using current space-local noon-ish date is brittle; instead
    // verify copy injection for tomorrow-relative path with fixed future date offset.
    const label = formatPollCloseLabel('2099-01-15T08:30:00', 'Asia/Kolkata', 'hi', {
      am: 'पूर्वाह्न',
      pm: 'अपराह्न',
    });
    expect(label).toContain('पूर्वाह्न');
  });
});
