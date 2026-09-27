import type {
  MemberOccupancyListResponse,
  OccupancyHistoryEntryResponse,
  OccupancyResponse,
} from '../api/types';

function fromOccupancy(
  occupancy: OccupancyResponse,
  eventType: OccupancyHistoryEntryResponse['eventType'],
  performedAt: string,
  suffix: string,
): OccupancyHistoryEntryResponse {
  return {
    historyId: `synth-${suffix}-${occupancy.occupancyId}`,
    occupancyId: occupancy.occupancyId,
    eventType,
    toTargetType: occupancy.targetType,
    toBuildingId: occupancy.buildingId,
    toFloorId: occupancy.floorId ?? null,
    toUnitId: occupancy.unitId ?? null,
    toRoomId: occupancy.roomId ?? null,
    toBedId: occupancy.bedId ?? null,
    performedBy: occupancy.allocatedBy,
    performedAt,
    remarks: occupancy.remarks ?? null,
  };
}

function collectOccupancies(
  data: MemberOccupancyListResponse,
): OccupancyResponse[] {
  const records = new Map<string, OccupancyResponse>();
  for (const occupancy of data.occupancies ?? []) {
    records.set(occupancy.occupancyId, occupancy);
  }
  if (data.currentOccupancy) {
    records.set(data.currentOccupancy.occupancyId, data.currentOccupancy);
  }
  if (data.reservedOccupancy) {
    records.set(data.reservedOccupancy.occupancyId, data.reservedOccupancy);
  }
  return [...records.values()];
}

/** Prefer server event log; if empty, synthesize from current/past occupancies. */
export function resolveOccupancyHistoryEntries(
  data: MemberOccupancyListResponse | null | undefined,
): OccupancyHistoryEntryResponse[] {
  if (!data) {
    return [];
  }

  if (data.history.length > 0) {
    return [...data.history].sort(
      (a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
    );
  }

  const entries: OccupancyHistoryEntryResponse[] = [];
  for (const occupancy of collectOccupancies(data)) {
    if (occupancy.status === 'RESERVED' && occupancy.reservedAt) {
      entries.push(fromOccupancy(occupancy, 'RESERVED', occupancy.reservedAt, 'reserved'));
    } else if (occupancy.allocatedAt) {
      entries.push(fromOccupancy(occupancy, 'ALLOCATED', occupancy.allocatedAt, 'allocated'));
    }

    const moveInAt =
      occupancy.actualMoveInAt ?? (occupancy.status === 'ACTIVE' ? occupancy.moveInDate : null);
    if (moveInAt) {
      entries.push(fromOccupancy(occupancy, 'MOVE_IN', moveInAt, 'movein'));
    }

    if (occupancy.vacatedAt) {
      entries.push(fromOccupancy(occupancy, 'VACATED', occupancy.vacatedAt, 'vacated'));
    }
  }

  return entries.sort(
    (a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
  );
}

export function occupancyLocationLabel(
  occupancy: OccupancyResponse | undefined,
): string | undefined {
  if (!occupancy) {
    return undefined;
  }
  const parts = [
    occupancy.buildingName,
    occupancy.floorName,
    occupancy.unitName,
    occupancy.roomName,
    occupancy.bedName,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function occupancyById(
  data: MemberOccupancyListResponse | null | undefined,
): Map<string, OccupancyResponse> {
  const map = new Map<string, OccupancyResponse>();
  if (!data) {
    return map;
  }
  for (const occupancy of collectOccupancies(data)) {
    map.set(occupancy.occupancyId, occupancy);
  }
  return map;
}
