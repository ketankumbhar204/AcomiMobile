import { stayChoiceDefaultLabel, stayChoiceLabelKey } from '../shortStay';

describe('stayChoice labels (UI only)', () => {
  it('maps internal enums to the approved owner-facing names', () => {
    expect(stayChoiceDefaultLabel('MONTHLY')).toBe('Monthly');
    expect(stayChoiceDefaultLabel('SHORT')).toBe('Daily');
    expect(stayChoiceDefaultLabel('OPEN_ENDED')).toBe('No Fixed Move-Out Date');
  });

  it('keeps i18n keys stable for SHORT / OPEN_ENDED', () => {
    expect(stayChoiceLabelKey('SHORT')).toBe('occupancy.section.shortStayChoice');
    expect(stayChoiceLabelKey('OPEN_ENDED')).toBe('occupancy.section.openEndedStayChoice');
    expect(stayChoiceLabelKey('MONTHLY')).toBe('occupancy.section.monthlyStayChoice');
  });
});
