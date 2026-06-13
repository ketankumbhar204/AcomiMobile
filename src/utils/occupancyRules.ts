import type {
  AllocationTargetType,
  AllocateOccupancyRequest,
  CurrentOccupancySummaryResponse,
  SpaceType,
  TransferOccupancyRequest,
} from '../api/types';

export function getAllowedTargetTypes(spaceType: SpaceType): AllocationTargetType[] {
  switch (spaceType) {
    case 'PG':
    case 'HOSTEL':
      return ['BED'];
    case 'CO_LIVING':
      // Room allocation rules are not finalized. Keep implementation; do not expand
      // usage. Future review required before billing.
      return ['BED', 'ROOM'];
    case 'RENTAL':
      return ['UNIT'];
    default:
      return [];
  }
}

export function defaultTargetType(spaceType: SpaceType): AllocationTargetType | null {
  const allowed = getAllowedTargetTypes(spaceType);
  return allowed[0] ?? null;
}

export function validateTargetSelection(
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
): string | null {
  const allowed = getAllowedTargetTypes(spaceType);
  if (!allowed.includes(targetType)) {
    return 'occupancy.errors.invalidTargetType';
  }
  if (targetType === 'BED' && !ids.bedId) {
    return 'occupancy.errors.bedRequired';
  }
  if (targetType === 'ROOM' && !ids.roomId) {
    return 'occupancy.errors.roomRequired';
  }
  if (targetType === 'UNIT' && !ids.unitId) {
    return 'occupancy.errors.unitRequired';
  }
  return null;
}

export function buildAllocateRequest(
  memberId: string,
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  options?: { expectedCheckoutDate?: string; remarks?: string },
): { body: AllocateOccupancyRequest | null; errorKey: string | null } {
  const errorKey = validateTargetSelection(spaceType, targetType, ids);
  if (errorKey) {
    return { body: null, errorKey };
  }
  return {
    body: {
      memberId,
      targetType,
      bedId: targetType === 'BED' ? ids.bedId : null,
      roomId: targetType === 'ROOM' ? ids.roomId : null,
      unitId: targetType === 'UNIT' ? ids.unitId : null,
      expectedCheckoutDate: options?.expectedCheckoutDate || null,
      remarks: options?.remarks?.trim() || null,
    },
    errorKey: null,
  };
}

export function buildTransferRequest(
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  remarks?: string,
): { body: TransferOccupancyRequest | null; errorKey: string | null } {
  const errorKey = validateTargetSelection(spaceType, targetType, ids);
  if (errorKey) {
    return { body: null, errorKey };
  }
  return {
    body: {
      targetType,
      bedId: targetType === 'BED' ? ids.bedId : null,
      roomId: targetType === 'ROOM' ? ids.roomId : null,
      unitId: targetType === 'UNIT' ? ids.unitId : null,
      remarks: remarks?.trim() || null,
    },
    errorKey: null,
  };
}

export function formatOccupancyAllocatedDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatOccupancyLocation(
  summary: CurrentOccupancySummaryResponse | null | undefined,
): string {
  if (!summary) {
    return '';
  }
  const parts = [summary.buildingName];
  if (summary.floorName) {
    parts.push(summary.floorName);
  }
  if (summary.unitName) {
    parts.push(summary.unitName);
  }
  if (summary.roomName) {
    parts.push(summary.roomName);
  }
  if (summary.bedName) {
    parts.push(summary.bedName);
  }
  return parts.join(' · ');
}
