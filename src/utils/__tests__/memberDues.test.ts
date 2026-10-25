import type { MemberResponse } from '../../api/types';
import { defaultMemberListFilters, filterAndSortMembers } from '../memberListQuery';
import {
  matchesPaymentDuesFilter,
  memberDuesCue,
  type MemberDuesSnapshot,
} from '../memberDues';

function row(partial: Partial<MemberDuesSnapshot>): MemberDuesSnapshot {
  return {
    pending: null,
    underReview: null,
    expectedCharges: null,
    ...partial,
  };
}

function member(id: string, name: string): MemberResponse {
  return {
    memberId: id,
    fullName: name,
    mobileNumber: '9000000000',
    role: 'TENANT',
    linkedUser: false,
    status: 'ACTIVE',
    createdAt: '2026-10-03T00:00:00Z',
  };
}

describe('memberDuesCue', () => {
  it('treats a fully unpaid charge as pending', () => {
    expect(memberDuesCue(row({ expectedCharges: 6000, pending: 6000, underReview: 0 }))).toEqual({
      kind: 'due',
      amount: 6000,
    });
  });

  it('uses the residual after a partial payment, not the full charge', () => {
    expect(memberDuesCue(row({ expectedCharges: 6000, pending: 4000, underReview: 0 }))).toEqual({
      kind: 'due',
      amount: 4000,
    });
  });

  it('treats a fully paid charge as clear', () => {
    expect(memberDuesCue(row({ expectedCharges: 6000, pending: 0, underReview: 0 }))).toEqual({
      kind: 'clear',
    });
  });

  it('keeps an amount awaiting review out of the pending balance', () => {
    expect(memberDuesCue(row({ expectedCharges: 6000, pending: 0, underReview: 6000 }))).toEqual({
      kind: 'review',
      amount: 6000,
    });
  });

  it('shows the remaining pending when part of the charge is under review', () => {
    expect(memberDuesCue(row({ expectedCharges: 6000, pending: 2000, underReview: 4000 }))).toEqual({
      kind: 'due',
      amount: 2000,
    });
  });

  it('does not treat a missing ledger or a zero-charge row as settled', () => {
    expect(memberDuesCue(undefined)).toBeNull();
    expect(memberDuesCue(null)).toBeNull();
    expect(memberDuesCue(row({ expectedCharges: 0, pending: 0, underReview: 0 }))).toBeNull();
    expect(memberDuesCue(row({ expectedCharges: null, pending: null }))).toBeNull();
  });
});

describe('payment dues filter', () => {
  const dues = new Map<string, MemberDuesSnapshot>([
    ['due', row({ expectedCharges: 6000, pending: 4000 })],
    ['clear', row({ expectedCharges: 6000, pending: 0 })],
    ['review', row({ expectedCharges: 6000, pending: 0, underReview: 1000 })],
  ]);
  const members = [member('due', 'Due'), member('clear', 'Clear'), member('none', 'None'), member('review', 'Review')];

  it('keeps name search working alongside the dues filter', () => {
    const result = filterAndSortMembers(members, {
      search: 'cle',
      filters: { ...defaultMemberListFilters(), paymentDues: 'all' },
      duesByMemberId: dues,
    });
    expect(result.map(item => item.memberId)).toEqual(['clear']);
  });

  it('returns only members with an outstanding residual', () => {
    const result = filterAndSortMembers(members, {
      search: '',
      filters: { ...defaultMemberListFilters(), paymentDues: 'pending' },
      duesByMemberId: dues,
    });
    expect(result.map(item => item.memberId)).toEqual(['due']);
  });

  it('returns only members whose charges are settled', () => {
    const result = filterAndSortMembers(members, {
      search: '',
      filters: { ...defaultMemberListFilters(), paymentDues: 'clear' },
      duesByMemberId: dues,
    });
    expect(result.map(item => item.memberId)).toEqual(['clear']);
    expect(matchesPaymentDuesFilter(null, 'clear')).toBe(false);
    expect(matchesPaymentDuesFilter(memberDuesCue(dues.get('review')), 'pending')).toBe(false);
  });
});
