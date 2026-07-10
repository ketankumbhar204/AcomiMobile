import type { OccupancyResponse } from '../../api/types';
import {
  computeOccupancyMonthlyTotalForMonth,
  isOccupancyBillableInMonth,
} from '../occupancyContract';

function occupancy(overrides: Partial<OccupancyResponse>): OccupancyResponse {
  return {
    occupancyId: 'occ-1',
    spaceId: 'space-1',
    memberId: 'member-1',
    memberName: 'Tenant One',
    targetType: 'BED',
    buildingId: 'building-1',
    buildingName: 'Block A',
    allocatedAt: '2026-07-01T00:00:00Z',
    allocatedBy: 'user-1',
    status: 'ACTIVE',
    moveInDate: '2026-07-01',
    rentSnapshot: 10000,
    ...overrides,
  };
}

describe('occupancy month billing', () => {
  it('excludes tenants before their move-in month', () => {
    const row = occupancy({ moveInDate: '2026-07-01' });

    expect(isOccupancyBillableInMonth(row, '2026-05')).toBe(false);
    expect(computeOccupancyMonthlyTotalForMonth(row, '2026-05')).toBeNull();
    expect(isOccupancyBillableInMonth(row, '2026-07')).toBe(true);
    expect(computeOccupancyMonthlyTotalForMonth(row, '2026-07')).toBe(10000);
  });

  it('excludes reserved occupancies', () => {
    const row = occupancy({ status: 'RESERVED', moveInDate: '2026-07-01' });

    expect(isOccupancyBillableInMonth(row, '2026-07')).toBe(false);
  });

  it('excludes vacated tenants after their vacated month', () => {
    const row = occupancy({
      status: 'VACATED',
      moveInDate: '2026-03-01',
      vacatedAt: '2026-04-30T10:00:00Z',
    });

    expect(isOccupancyBillableInMonth(row, '2026-05')).toBe(false);
    expect(isOccupancyBillableInMonth(row, '2026-04')).toBe(true);
  });
});
