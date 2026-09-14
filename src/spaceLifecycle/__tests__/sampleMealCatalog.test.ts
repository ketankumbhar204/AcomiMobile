import {
  catalogHasAnyMealLibrary,
  catalogHasCuratedMealLibrary,
  isSystemSampleComboName,
} from '../sampleMealCatalog';

describe('sampleMealCatalog', () => {
  it('recognizes seeded combo names case-insensitively', () => {
    expect(isSystemSampleComboName('Standard Lunch Thali')).toBe(true);
    expect(isSystemSampleComboName('dal rice combo')).toBe(true);
    expect(isSystemSampleComboName('Owner Special Thali')).toBe(false);
  });

  it('treats sample seed as present but not curated', () => {
    const samplesWithSeedItems = {
      items: [{ isActive: true }, { isActive: true }],
      combos: [
        { isActive: true, name: 'Standard Lunch Thali' },
        { isActive: true, name: 'Egg Combo' },
      ],
    };
    expect(catalogHasAnyMealLibrary(samplesWithSeedItems)).toBe(true);
    expect(catalogHasCuratedMealLibrary(samplesWithSeedItems)).toBe(false);
  });

  it('treats item-only catalogs (no combos) as curated', () => {
    const withItem = {
      items: [{ isActive: true }],
      combos: [] as Array<{ isActive: boolean; name?: string | null }>,
    };
    expect(catalogHasCuratedMealLibrary(withItem)).toBe(true);
  });

  it('treats a non-sample combo as curated', () => {
    const custom = {
      items: [{ isActive: true }],
      combos: [{ isActive: true, name: 'Owner Special Thali' }],
    };
    expect(catalogHasCuratedMealLibrary(custom)).toBe(true);
  });
});
