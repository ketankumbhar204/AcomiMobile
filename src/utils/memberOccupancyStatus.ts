import type { MemberOccupancyStatus } from '../api/types';

export const MEMBER_OCCUPANCY_STATUS_COLORS: Record<MemberOccupancyStatus, string> = {
  ALLOCATED: '#16a34a',
  RESERVED: '#d97706',
  VACATED: '#6b7280',
};

export function getMemberOccupancyStatusColor(
  status: MemberOccupancyStatus,
): string {
  return MEMBER_OCCUPANCY_STATUS_COLORS[status];
}

export function getMemberOccupancyStatusLabelKey(
  status: MemberOccupancyStatus,
): string {
  return `occupancy.memberStatus.${status}`;
}

export function resolveMemberOccupancyStatus(
  status?: MemberOccupancyStatus | null,
): MemberOccupancyStatus {
  return status ?? 'VACATED';
}
