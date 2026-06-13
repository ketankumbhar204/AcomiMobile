import type {
  AllocationTargetType,
  AllocateOccupancyRequest,
  ContractSnapshotInput,
  CurrentOccupancySummaryResponse,
  MemberCategory,
  ReserveOccupancyRequest,
  SpaceType,
  TransferOccupancyRequest,
  TransferRentPolicy,
} from '../api/types';

export type OccupancyTargetSelection = {
  targetType: AllocationTargetType;
  buildingId: string;
  buildingName: string;
  floorId?: string;
  floorName?: string;
  unitId?: string;
  unitName?: string;
  roomId?: string;
  roomName?: string;
  bedId?: string;
  bedName?: string;
};

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

export function getExpectedExitDate(options?: {
  expectedExitDate?: string;
  expectedCheckoutDate?: string;
}): string | null {
  const value = options?.expectedExitDate?.trim() || options?.expectedCheckoutDate?.trim();
  return value || null;
}

export function buildReserveRequest(
  memberId: string,
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  options: {
    moveInDate: string;
    expectedExitDate?: string;
    expectedCheckoutDate?: string;
    memberCategory?: MemberCategory;
    remarks?: string;
  },
): { body: ReserveOccupancyRequest | null; errorKey: string | null } {
  const errorKey = validateTargetSelection(spaceType, targetType, ids);
  if (errorKey) {
    return { body: null, errorKey };
  }
  if (!options.moveInDate.trim()) {
    return { body: null, errorKey: 'occupancy.errors.moveInDateRequired' };
  }
  return {
    body: {
      memberId,
      targetType,
      bedId: targetType === 'BED' ? ids.bedId : null,
      roomId: targetType === 'ROOM' ? ids.roomId : null,
      unitId: targetType === 'UNIT' ? ids.unitId : null,
      moveInDate: options.moveInDate.trim(),
      expectedExitDate: getExpectedExitDate(options),
      memberCategory: options.memberCategory ?? null,
      remarks: options.remarks?.trim() || null,
    },
    errorKey: null,
  };
}

export function buildAllocateRequest(
  memberId: string,
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  options?: {
    expectedCheckoutDate?: string;
    expectedExitDate?: string;
    remarks?: string;
    contract?: ContractSnapshotInput;
  },
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
      expectedCheckoutDate: getExpectedExitDate(options),
      expectedExitDate: getExpectedExitDate(options),
      remarks: options?.remarks?.trim() || null,
      ...options?.contract,
    },
    errorKey: null,
  };
}

export function buildTransferRequest(
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  options?: {
    remarks?: string;
    rentPolicy?: TransferRentPolicy;
    contract?: ContractSnapshotInput;
  },
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
      remarks: options?.remarks?.trim() || null,
      rentPolicy: options?.rentPolicy ?? 'APPLY_NEW',
      ...options?.contract,
    },
    errorKey: null,
  };
}

export function formatTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export function getOccupancyExitDate(
  occupancy?: {
    expectedExitDate?: string | null;
    expectedCheckoutDate?: string | null;
  } | null,
): string | null {
  return occupancy?.expectedExitDate ?? occupancy?.expectedCheckoutDate ?? null;
}

export function isMoveInDateInFuture(moveInDate?: string | null): boolean {
  if (!moveInDate) {
    return false;
  }
  const date = new Date(moveInDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() > today.getTime();
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
