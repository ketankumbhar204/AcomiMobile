import { extractIsoDateFromText } from '../extractIsoDateFromText';

describe('extractIsoDateFromText', () => {
  it('extracts YYYY-MM-DD from meal poll messages', () => {
    expect(extractIsoDateFromText('DINNER · 2026-07-14')).toBe('2026-07-14');
    expect(extractIsoDateFromText('LUNCH · 2026-07-14')).toBe('2026-07-14');
  });

  it('searches multiple parts and ignores missing values', () => {
    expect(extractIsoDateFromText(null, undefined, 'Meal poll opened', 'BREAKFAST · 2026-07-13')).toBe(
      '2026-07-13',
    );
  });

  it('returns null when no ISO date is present', () => {
    expect(extractIsoDateFromText('No date here', 'Jul 14')).toBeNull();
  });
});
