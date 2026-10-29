import { getAccommodationUiProfile, usesUnitLevelOccupancy } from '../accommodationProfile';
import { applyUnitOccupancyCounts, countActiveUnitsByStatus } from '../unitLevelOccupancy';

describe('usesUnitLevelOccupancy', () => {
  it('is true for rental and corporate stay', () => {
    expect(usesUnitLevelOccupancy(getAccommodationUiProfile('RENTAL'))).toBe(true);
    expect(usesUnitLevelOccupancy(getAccommodationUiProfile('CORPORATE_STAY'))).toBe(true);
  });

  it('is false for PG, hostel, co-living, and mess', () => {
    expect(usesUnitLevelOccupancy(getAccommodationUiProfile('PG'))).toBe(false);
    expect(usesUnitLevelOccupancy(getAccommodationUiProfile('PG', 'APARTMENT_PG'))).toBe(false);
    expect(usesUnitLevelOccupancy(getAccommodationUiProfile('HOSTEL'))).toBe(false);
    expect(usesUnitLevelOccupancy(getAccommodationUiProfile('CO_LIVING'))).toBe(false);
    expect(usesUnitLevelOccupancy(getAccommodationUiProfile('MESS'))).toBe(false);
    expect(usesUnitLevelOccupancy(null)).toBe(false);
  });
});

describe('countActiveUnitsByStatus', () => {
  it('counts active unit statuses and skips inactive units', () => {
    expect(
      countActiveUnitsByStatus([
        { status: 'OCCUPIED', active: true },
        { status: 'OCCUPIED', active: true },
        { status: 'AVAILABLE', active: true },
        { status: 'RESERVED', active: true },
        { status: 'OCCUPIED', active: false },
        { status: 'MAINTENANCE', active: true },
      ]),
    ).toEqual({ occupied: 2, available: 1, reserved: 1 });
  });
});

describe('applyUnitOccupancyCounts', () => {
  it('replaces bed totals with unit counts and keeps move-ins and payments', () => {
    expect(
      applyUnitOccupancyCounts(
        {
          occupiedBeds: 0,
          vacantBeds: 0,
          reservedBeds: 0,
          moveInsThisMonth: 2,
          pendingPaymentsCount: 4,
        },
        { occupied: 2, available: 8, reserved: 1 },
      ),
    ).toEqual({
      occupiedBeds: 2,
      vacantBeds: 8,
      reservedBeds: 1,
      moveInsThisMonth: 2,
      pendingPaymentsCount: 4,
    });
  });
});
