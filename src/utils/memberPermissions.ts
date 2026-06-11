import type { MembershipRole } from '../api/types';

export function canAddMember(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canEditMember(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canInviteMember(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canCancelInvitation(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canRemoveMember(role: MembershipRole | undefined): boolean {
  return role === 'OWNER';
}
