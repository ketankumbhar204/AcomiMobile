import type { MemberResponse } from '../../api/types';
import {
  defaultMemberListFilters,
  filterAndSortMembers,
  statusesForSpace,
} from '../memberListQuery';

function member(
  overrides: Partial<MemberResponse> & Pick<MemberResponse, 'memberId' | 'fullName'>,
): MemberResponse {
  return {
    mobileNumber: '9999999999',
    role: 'TENANT',
    linkedUser: false,
    status: 'ACTIVE',
    occupancyStatus: 'ALLOCATED',
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('member list status filter', () => {
  const rows = [
    member({ memberId: 'in', fullName: 'In', occupancyStatus: 'ALLOCATED' }),
    member({ memberId: 'reserved', fullName: 'Reserved', occupancyStatus: 'RESERVED' }),
    member({
      memberId: 'out',
      fullName: 'Out',
      status: 'ACTIVE',
      occupancyStatus: 'VACATED',
    }),
    member({
      memberId: 'staff',
      fullName: 'Staff',
      role: 'STAFF',
      status: 'ACTIVE',
      occupancyStatus: undefined,
    }),
  ];

  it('offers stay statuses for lodging spaces', () => {
    expect(statusesForSpace('PG')).toEqual(['ALLOCATED', 'RESERVED', 'VACATED']);
    expect(statusesForSpace('MESS')).toEqual([
      'ACTIVE',
      'VACATED',
      'SUSPENDED',
      'BLACKLISTED',
    ]);
  });

  it('finds vacated tenants by occupancy even when account status is still ACTIVE', () => {
    const result = filterAndSortMembers(rows, {
      search: '',
      spaceType: 'PG',
      filters: {
        ...defaultMemberListFilters(),
        statuses: new Set(['VACATED']),
      },
    });
    expect(result.map(item => item.memberId)).toEqual(['out']);
  });

  it('filters reserved tenants by RESERVED stay', () => {
    const result = filterAndSortMembers(rows, {
      search: '',
      spaceType: 'HOSTEL',
      filters: {
        ...defaultMemberListFilters(),
        statuses: new Set(['RESERVED']),
      },
    });
    expect(result.map(item => item.memberId)).toEqual(['reserved']);
  });

  it('filters moved-in tenants by ALLOCATED stay', () => {
    const result = filterAndSortMembers(rows, {
      search: '',
      spaceType: 'RENTAL',
      filters: {
        ...defaultMemberListFilters(),
        statuses: new Set(['ALLOCATED']),
      },
    });
    expect(result.map(item => item.memberId)).toEqual(['in']);
  });

  it('keeps KPI Active on account status for lodging spaces', () => {
    const result = filterAndSortMembers(rows, {
      search: '',
      spaceType: 'PG',
      filters: {
        ...defaultMemberListFilters(),
        statuses: new Set(['ACTIVE']),
      },
    });
    expect(result.map(item => item.memberId).sort()).toEqual([
      'in',
      'out',
      'reserved',
      'staff',
    ]);
  });
});
