import { extractIsoDateFromText, extractMealTypeFromText } from '../extractIsoDateFromText';

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

describe('extractMealTypeFromText', () => {
  it('reads the meal token from a poll message', () => {
    expect(extractMealTypeFromText('DINNER · 2026-10-09 · Sunrise PG')).toBe('DINNER');
    expect(extractMealTypeFromText('Check today', 'BREAKFAST · 2026-10-09')).toBe('BREAKFAST');
  });

  it('returns null when the text has no meal type', () => {
    expect(extractMealTypeFromText("Check today's menu for Sunrise PG.")).toBeNull();
  });
});
