import { getAccommodationUiProfile, visibleBuildingSummaryParts, visiblePositiveStructureCounts } from '../accommodationProfile';

describe('visibleBuildingSummaryParts', () => {
  it('keeps floors, rooms, and beds for PG and hostel', () => {
    expect(visibleBuildingSummaryParts(getAccommodationUiProfile('PG')!)).toBe(
      'combinedFloorsRoomsBeds',
    );
    expect(visibleBuildingSummaryParts(getAccommodationUiProfile('HOSTEL')!)).toBe(
      'combinedFloorsRoomsBeds',
    );
  });

  it('keeps floors, rooms, and beds for apartment PG', () => {
    expect(
      visibleBuildingSummaryParts(getAccommodationUiProfile('PG', 'APARTMENT_PG')!),
    ).toBe('combinedFloorsRoomsBeds');
  });

  it('shows units, rooms, and beds for co-living', () => {
    expect(visibleBuildingSummaryParts(getAccommodationUiProfile('CO_LIVING')!)).toEqual([
      'units',
      'rooms',
      'beds',
    ]);
  });

  it('shows units only for rental and corporate stay', () => {
    expect(visibleBuildingSummaryParts(getAccommodationUiProfile('RENTAL')!)).toEqual(['units']);
    expect(visibleBuildingSummaryParts(getAccommodationUiProfile('CORPORATE_STAY')!)).toEqual([
      'units',
    ]);
  });

  it('returns null profile for mess', () => {
    expect(getAccommodationUiProfile('MESS')).toBeNull();
  });
});

describe('visiblePositiveStructureCounts', () => {
  it('omits zero rooms and beds for a unit-only structure', () => {
    expect(
      visiblePositiveStructureCounts({ floors: 0, units: 10, rooms: 0, beds: 0 }),
    ).toEqual(['units']);
  });

  it('keeps rooms and beds when a PG structure has them', () => {
    expect(
      visiblePositiveStructureCounts({ floors: 2, units: 0, rooms: 8, beds: 16 }),
    ).toEqual(['floors', 'rooms', 'beds']);
  });

  it('returns no lines when every count is zero', () => {
    expect(
      visiblePositiveStructureCounts({ floors: 0, units: 0, rooms: 0, beds: 0 }),
    ).toEqual([]);
  });
});
