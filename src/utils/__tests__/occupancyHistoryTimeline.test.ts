import type { MemberOccupancyListResponse, OccupancyResponse } from '../../api/types';
import { resolveOccupancyHistoryEntries } from '../occupancyHistoryTimeline';

function occupancy(
  overrides: Partial<OccupancyResponse> & Pick<OccupancyResponse, 'occupancyId' | 'status'>,
): OccupancyResponse {
  return {
    spaceId: 'space-1',
    memberId: 'member-1',
    memberName: 'Ravi',
    targetType: 'BED',
    buildingId: 'b1',
    buildingName: 'PG 1',
    allocatedAt: '2026-09-26T10:00:00Z',
    allocatedBy: 'owner-1',
    ...overrides,
  };
}

describe('resolveOccupancyHistoryEntries', () => {
  it('returns server history when present', () => {
    const data: MemberOccupancyListResponse = {
      currentOccupancy: null,
      reservedOccupancy: null,
      occupancies: [],
      history: [
        {
          historyId: 'h1',
          occupancyId: 'o1',
          eventType: 'ALLOCATED',
          performedBy: 'owner-1',
          performedAt: '2026-09-26T10:00:00Z',
        },
      ],
    };
    expect(resolveOccupancyHistoryEntries(data)).toHaveLength(1);
    expect(resolveOccupancyHistoryEntries(data)[0].historyId).toBe('h1');
  });

  it('synthesizes allocate + move-in from an active stay when history is empty', () => {
    const data: MemberOccupancyListResponse = {
      currentOccupancy: occupancy({
        occupancyId: 'o1',
        status: 'ACTIVE',
        actualMoveInAt: '2026-09-26T12:00:00Z',
      }),
      reservedOccupancy: null,
      occupancies: [],
      history: [],
    };
    const entries = resolveOccupancyHistoryEntries(data);
    expect(entries.map(entry => entry.eventType)).toEqual(['ALLOCATED', 'MOVE_IN']);
  });
});
