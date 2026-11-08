import {
  AVAILABILITY_DISPLAY_FALLBACK,
  availabilityDisplayLabelKey,
  availabilityDrilldownEmptyKey,
  availabilityDrilldownTitleKey,
} from '../availabilityDisplayLabel';

describe('availabilityDisplayLabel', () => {
  it('maps display nouns to i18n keys without renaming internal vacant status', () => {
    expect(availabilityDisplayLabelKey('short')).toBe(
      'dashboard.accommodationOperations.vacantBedsShort',
    );
    expect(availabilityDisplayLabelKey('beds')).toBe(
      'dashboard.accommodationOperations.vacantBeds',
    );
    expect(availabilityDisplayLabelKey('units')).toBe(
      'dashboard.accommodationOperations.availableUnits',
    );
  });

  it('keeps drilldown keys stable while fallbacks use Available wording', () => {
    expect(availabilityDrilldownTitleKey()).toBe('dashboard.drilldown.vacantBedsTitle');
    expect(availabilityDrilldownEmptyKey()).toBe('dashboard.drilldown.emptyVacantBeds');
    expect(AVAILABILITY_DISPLAY_FALLBACK.beds).toBe('Available beds');
    expect(AVAILABILITY_DISPLAY_FALLBACK.empty).toBe('No available beds');
  });
});
