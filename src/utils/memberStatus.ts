import type { MemberStatus } from '../api/types';

export const MEMBER_STATUS_COLORS: Record<MemberStatus, string> = {
  ACTIVE: '#22c55e',
  VACATED: '#6b7280',
  SUSPENDED: '#f97316',
  BLACKLISTED: '#ef4444',
};

export const MEMBER_STATUS_OPTIONS: MemberStatus[] = [
  'ACTIVE',
  'VACATED',
  'SUSPENDED',
  'BLACKLISTED',
];

export function getMemberStatusColor(status: MemberStatus): string {
  return MEMBER_STATUS_COLORS[status];
}

export function getMemberStatusLabelKey(status: MemberStatus): string {
  return `membership.status.${status}`;
}
