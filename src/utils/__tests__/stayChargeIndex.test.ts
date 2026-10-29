import type { OccupancyResponse } from '../../api/types';
import { summaryForBed, summaryForUnit, type StayChargeIndex } from '../stayChargeIndex';

function occupancy(
  overrides: Partial<OccupancyResponse> & Pick<OccupancyResponse, 'occupancyId'>,
): OccupancyResponse {
  return {
    spaceId: 'space-1',
    memberId: 'member-1',
    memberName: 'Rahul Kumar',
    targetType: 'UNIT',
    buildingId: 'b1',
    buildingName: 'Test Corporate Stay1',
    allocatedAt: '2026-09-14T00:00:00Z',
    allocatedBy: 'owner-1',
    status: 'ACTIVE',
    ...overrides,
  };
}

function index(rows: OccupancyResponse[]): StayChargeIndex {
  const occupancyByBed = new Map<string, OccupancyResponse>();
  const occupancyByUnit = new Map<string, OccupancyResponse>();
  for (const row of rows) {
    if (row.bedId) {
      occupancyByBed.set(row.bedId, row);
    } else if (row.unitId) {
      occupancyByUnit.set(row.unitId, row);
    }
  }
  return {
    month: '2026-10',
    occupancyByBed,
    occupancyByUnit,
    payments: [],
  };
}

describe('stay charge lookup', () => {
  it('keeps a bed stay on the bed and does not invent a unit stay', () => {
    const stay = occupancy({
      occupancyId: 'occ-bed',
      targetType: 'BED',
      bedId: 'bed-a',
      unitId: 'unit-1',
      memberName: 'Rahul Kumar',
    });
    const charges = index([stay]);
    expect(summaryForBed(charges, 'bed-a').occupancy?.memberName).toBe('Rahul Kumar');
    expect(summaryForUnit(charges, 'unit-1').occupancy).toBeNull();
  });

  it('finds a unit-only stay without a bed', () => {
    const stay = occupancy({
      occupancyId: 'occ-unit',
      unitId: 'unit-102',
      bedId: null,
      memberName: 'Preetam',
    });
    const charges = index([stay]);
    expect(summaryForUnit(charges, 'unit-102').occupancy?.memberName).toBe('Preetam');
    expect(summaryForBed(charges, 'unit-102').occupancy).toBeNull();
  });
});
