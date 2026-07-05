import type {
  MemberResponse,
  MembershipRole,
  MemberStatus,
  PendingInvitationResponse,
  SpaceType,
} from '../api/types';

export type MemberSortOption = 'name_asc' | 'name_desc' | 'recent' | 'role';

export const MEMBER_STATUSES: MemberStatus[] = [
  'ACTIVE',
  'VACATED',
  'SUSPENDED',
  'BLACKLISTED',
];

const ROLE_SORT_ORDER: Record<MembershipRole, number> = {
  OWNER: 0,
  MANAGER: 1,
  STAFF: 2,
  TENANT: 3,
  CUSTOMER: 4,
};

export const DEFAULT_MEMBER_SORT: MemberSortOption = 'name_asc';

export type MemberListFilterState = {
  roles: Set<MembershipRole>;
  statuses: Set<MemberStatus>;
  sort: MemberSortOption;
};

export function defaultMemberListFilters(): MemberListFilterState {
  return {
    roles: new Set(),
    statuses: new Set(),
    sort: DEFAULT_MEMBER_SORT,
  };
}

export function rolesForSpace(spaceType: SpaceType | undefined): MembershipRole[] {
  if (spaceType === 'MESS') {
    return ['CUSTOMER', 'STAFF', 'MANAGER', 'OWNER'];
  }
  return ['TENANT', 'STAFF', 'MANAGER', 'OWNER'];
}

const MEMBER_SORT_OPTIONS: MemberSortOption[] = ['name_asc', 'name_desc', 'recent', 'role'];

export function memberFilterOptionCount(spaceType: SpaceType | undefined): number {
  return rolesForSpace(spaceType).length + MEMBER_STATUSES.length + MEMBER_SORT_OPTIONS.length;
}

export function countMemberListFilters(
  filters: MemberListFilterState,
  spaceType: SpaceType | undefined,
): number {
  const allRoles = rolesForSpace(spaceType);
  let count = 0;
  if (filters.roles.size > 0 && filters.roles.size < allRoles.length) {
    count += 1;
  }
  if (filters.statuses.size > 0 && filters.statuses.size < MEMBER_STATUSES.length) {
    count += 1;
  }
  if (filters.sort !== DEFAULT_MEMBER_SORT) {
    count += 1;
  }
  return count;
}

function matchesMemberSearch(member: MemberResponse, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    member.fullName.toLowerCase().includes(q) ||
    member.mobileNumber.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
  );
}

function matchesRoleFilter(
  role: MembershipRole,
  selected: Set<MembershipRole>,
  allRoles: MembershipRole[],
): boolean {
  if (selected.size === 0 || selected.size >= allRoles.length) {
    return true;
  }
  return selected.has(role);
}

function matchesStatusFilter(status: MemberStatus, selected: Set<MemberStatus>): boolean {
  if (selected.size === 0 || selected.size >= MEMBER_STATUSES.length) {
    return true;
  }
  return selected.has(status);
}

export function filterAndSortMembers(
  members: MemberResponse[],
  options: {
    search: string;
    filters: MemberListFilterState;
    spaceType?: SpaceType;
  },
): MemberResponse[] {
  const allRoles = rolesForSpace(options.spaceType);

  const filtered = members.filter(member => {
    if (!matchesMemberSearch(member, options.search)) {
      return false;
    }
    if (!matchesRoleFilter(member.role, options.filters.roles, allRoles)) {
      return false;
    }
    if (!matchesStatusFilter(member.status ?? 'ACTIVE', options.filters.statuses)) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (options.filters.sort) {
      case 'name_desc':
        return b.fullName.localeCompare(a.fullName);
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'role': {
        const roleDiff = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
        return roleDiff !== 0 ? roleDiff : a.fullName.localeCompare(b.fullName);
      }
      case 'name_asc':
      default:
        return a.fullName.localeCompare(b.fullName);
    }
  });
}

export function filterPendingInvitations(
  invitations: PendingInvitationResponse[],
  options: {
    search: string;
    roles: Set<MembershipRole>;
    spaceType?: SpaceType;
  },
): PendingInvitationResponse[] {
  const q = options.search.trim().toLowerCase();
  const allRoles = rolesForSpace(options.spaceType);

  return invitations
    .filter(invitation => {
      if (!matchesRoleFilter(invitation.role, options.roles, allRoles)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        invitation.mobileNumber.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        invitation.invitedBy.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
