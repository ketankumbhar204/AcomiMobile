import type { BuildingSummaryResponse } from '../../../api/types';
import {
  aggregateUnitBedStatusCounts,
  aggregateUnitStatusCounts,
  buildingSummaryToStatusCounts,
} from '../layoutSummaryStats';

describe('buildingSummaryToStatusCounts', () => {
  it('uses bed-level counts when beds exist', () => {
    const summary = {
      beds: 3,
      units: 1,
      rooms: 1,
      available: 307,
      occupied: 3,
      reserved: 0,
      maintenance: 0,
      blocked: 0,
      availableBeds: 1,
      occupiedBeds: 1,
      reservedBeds: 1,
    } as BuildingSummaryResponse;

    expect(buildingSummaryToStatusCounts(summary)).toEqual({
      available: 1,
      occupied: 1,
      reserved: 1,
      maintenance: 0,
      blocked: 0,
    });
  });
});

describe('aggregateUnitBedStatusCounts', () => {
  it('sums bed counts across units', () => {
    const counts = aggregateUnitBedStatusCounts([
      {
        unitId: 'u1',
        name: 'Unit 101',
        roomCount: 1,
        bedCount: 3,
        availableBeds: 1,
        occupiedBeds: 1,
        status: 'AVAILABLE',
        synthetic: false,
      },
    ] as never);

    expect(counts).toEqual({
      available: 1,
      occupied: 1,
      reserved: 1,
      maintenance: 0,
      blocked: 0,
    });
  });

  it('falls back to entity status when bed counts are absent', () => {
    const counts = aggregateUnitStatusCounts([
      {
        unitId: 'u1',
        name: 'Unit 1',
        roomCount: 0,
        bedCount: 0,
        status: 'OCCUPIED',
        synthetic: false,
      },
    ] as never);

    expect(counts.occupied).toBe(1);
  });
});
