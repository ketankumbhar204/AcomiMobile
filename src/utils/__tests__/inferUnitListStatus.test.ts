import { inferUnitListStatus } from '../inferAggregateOccupancyStatus';

describe('inferUnitListStatus', () => {
  it('returns AVAILABLE when all beds are free', () => {
    expect(
      inferUnitListStatus({ bedCount: 7, availableBeds: 7, occupiedBeds: 0 }),
    ).toBe('AVAILABLE');
  });

  it('returns OCCUPIED when every bed is occupied', () => {
    expect(
      inferUnitListStatus({ bedCount: 3, availableBeds: 0, occupiedBeds: 3 }),
    ).toBe('OCCUPIED');
  });

  it('returns RESERVED for partial occupancy (1 of 7 beds)', () => {
    expect(
      inferUnitListStatus({ bedCount: 7, availableBeds: 6, occupiedBeds: 1 }),
    ).toBe('RESERVED');
  });

  it('derives available beds when only occupied count is provided', () => {
    expect(inferUnitListStatus({ bedCount: 7, occupiedBeds: 1 })).toBe('RESERVED');
  });

  it('returns null when unit has no beds', () => {
    expect(inferUnitListStatus({ bedCount: 0, occupiedBeds: 0 })).toBeNull();
  });
});
