import {
  amenityKey,
  buildAllPresetAmenities,
  defaultAssignedAmenities,
  normalizeAmenityAssignments,
  supportsSpaceAmenities,
  toggleAssignedAmenity,
} from '../amenities';

describe('amenities utils', () => {
  it('supportsSpaceAmenities only for PG, Hostel, Co-living', () => {
    expect(supportsSpaceAmenities('PG')).toBe(true);
    expect(supportsSpaceAmenities('HOSTEL')).toBe(true);
    expect(supportsSpaceAmenities('CO_LIVING')).toBe(true);
    expect(supportsSpaceAmenities('MESS')).toBe(false);
    expect(supportsSpaceAmenities('RENTAL')).toBe(false);
  });

  it('normalizeAmenityAssignments deduplicates and trims custom labels', () => {
    const normalized = normalizeAmenityAssignments([
      { code: 'WIFI', label: 'WiFi' },
      { code: 'WIFI', label: 'Duplicate' },
      { code: 'CUSTOM', label: ' Gym ' },
    ]);

    expect(normalized).toEqual([
      { code: 'WIFI', label: 'WiFi' },
      { code: 'CUSTOM', label: 'Gym' },
    ]);
  });

  it('normalizeAmenityAssignments replaces unresolved i18n keys with fallback labels', () => {
    const normalized = normalizeAmenityAssignments([
      { code: 'BEDS', label: 'spaces.amenities.codes.BEDS' },
      { code: 'WARDROBE', label: 'spaces.amenities.codes.WARDROBE' },
    ]);

    expect(normalized).toEqual([
      { code: 'BEDS', label: 'Beds' },
      { code: 'WARDROBE', label: 'Wardrobe / Cupboard' },
    ]);
  });

  it('buildAllPresetAmenities returns every preset code', () => {
    const all = buildAllPresetAmenities(code => code);
    expect(all).toHaveLength(12);
    expect(all.map(item => item.code)).toContain('WIFI');
    expect(all.map(item => item.code)).toContain('BEDS');
    expect(all.map(item => item.code)).toContain('WARDROBE');
  });

  it('toggleAssignedAmenity adds and removes assignments', () => {
    const available = [
      { code: 'WIFI', label: 'WiFi' },
      { code: 'PARKING', label: 'Parking' },
    ];
    const initial = defaultAssignedAmenities(available);

    const withoutWifi = toggleAssignedAmenity(available, initial, available[0]);
    expect(withoutWifi.map(amenityKey)).toEqual(['PARKING']);

    const withWifiAgain = toggleAssignedAmenity(available, withoutWifi, available[0]);
    expect(withWifiAgain.map(amenityKey)).toEqual(['PARKING', 'WIFI']);
  });
});
