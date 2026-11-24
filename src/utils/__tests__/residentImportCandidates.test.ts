import type { MemberImportCandidateResponse } from '../../api/types';
import {
  dedupeImportCandidates,
  mapImportCandidatesToPickerItems,
} from '../residentImportCandidates';

function candidate(
  overrides: Partial<MemberImportCandidateResponse> &
    Pick<MemberImportCandidateResponse, 'memberId' | 'mobileNumber'>,
): MemberImportCandidateResponse {
  return {
    fullName: 'Demo Person',
    role: 'TENANT',
    status: 'ACTIVE',
    occupancyStatus: 'VACATED',
    createdAt: '2026-01-01T00:00:00Z',
    sourceSpaceId: '11111111-1111-1111-1111-111111111111',
    sourceSpaceName: 'Hostel A',
    alreadyInTargetSpace: false,
    availableForMoveIn: true,
    ...overrides,
  };
}

describe('residentImportCandidates', () => {
  it('keeps cross-space residents when includeUnavailable is true', () => {
    const rows = [
      candidate({
        memberId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        mobileNumber: '9000000403',
        fullName: 'Ananya Patil',
        sourceSpaceName: 'Shree Ganesh Student Hostel',
        occupancyStatus: 'ALLOCATED',
        availableForMoveIn: false,
      }),
      candidate({
        memberId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        mobileNumber: '7777777713',
        fullName: 'Member Thirteen',
        sourceSpaceName: 'Shree Ganesh Student Hostel',
        occupancyStatus: 'VACATED',
        availableForMoveIn: true,
      }),
    ];

    const visible = mapImportCandidatesToPickerItems(rows, { includeUnavailable: true });
    const eligibleOnly = mapImportCandidatesToPickerItems(rows, { includeUnavailable: false });

    expect(visible.map(item => item.fullName)).toEqual(['Member Thirteen', 'Ananya Patil']);
    expect(eligibleOnly.map(item => item.fullName)).toEqual(['Member Thirteen']);
    expect(visible[1].needsImport).toBe(true);
    expect(visible[1].availableForMoveIn).toBe(false);
  });

  it('lists eligible residents before people blocked in the destination', () => {
    const rows = [
      candidate({
        memberId: '11111111-1111-1111-1111-111111111111',
        mobileNumber: '9000000303',
        fullName: 'Aditya Kulkarni',
        sourceSpaceName: 'Sai Residency PG',
        occupancyStatus: 'ALLOCATED',
        alreadyInTargetSpace: true,
        availableForMoveIn: false,
      }),
      candidate({
        memberId: '22222222-2222-2222-2222-222222222222',
        mobileNumber: '9000000502',
        fullName: 'Arjun Rao',
        sourceSpaceName: 'Shree Apartments',
        occupancyStatus: 'ALLOCATED',
        alreadyInTargetSpace: false,
        availableForMoveIn: true,
      }),
      candidate({
        memberId: '33333333-3333-3333-3333-333333333333',
        mobileNumber: '9000000403',
        fullName: 'Ananya Patil',
        sourceSpaceName: 'Sai Residency PG',
        occupancyStatus: 'VACATED',
        alreadyInTargetSpace: true,
        availableForMoveIn: true,
      }),
      candidate({
        memberId: '44444444-4444-4444-4444-444444444444',
        mobileNumber: '9000000504',
        fullName: 'Dev Rao',
        role: 'CUSTOMER',
        sourceSpaceName: 'Annapurna Mess',
        occupancyStatus: 'VACATED',
        alreadyInTargetSpace: false,
        availableForMoveIn: true,
      }),
      candidate({
        memberId: '55555555-5555-5555-5555-555555555555',
        mobileNumber: '7777777713',
        fullName: 'Member Thirteen',
        sourceSpaceName: 'Shree Ganesh Student Hostel',
        occupancyStatus: 'VACATED',
        alreadyInTargetSpace: false,
        availableForMoveIn: true,
      }),
      candidate({
        memberId: '66666666-6666-6666-6666-666666666666',
        mobileNumber: '9000000407',
        fullName: 'Meera Nair',
        sourceSpaceName: 'Shree Ganesh Student Hostel',
        occupancyStatus: 'RESERVED',
        alreadyInTargetSpace: false,
        availableForMoveIn: false,
      }),
    ];

    expect(
      mapImportCandidatesToPickerItems(rows, { includeUnavailable: true }).map(
        item => item.fullName,
      ),
    ).toEqual([
      'Dev Rao',
      'Member Thirteen',
      'Ananya Patil',
      'Arjun Rao',
      'Aditya Kulkarni',
      'Meera Nair',
    ]);
  });

  it('dedupes the same mobile and prefers an eligible destination association', () => {
    const rows = [
      candidate({
        memberId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        mobileNumber: '9000000888',
        sourceSpaceName: 'Hostel A',
        occupancyStatus: 'ALLOCATED',
        availableForMoveIn: false,
        alreadyInTargetSpace: false,
      }),
      candidate({
        memberId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        mobileNumber: '9000000888',
        sourceSpaceName: 'Sai Residency PG',
        occupancyStatus: 'VACATED',
        availableForMoveIn: true,
        alreadyInTargetSpace: true,
      }),
    ];

    const deduped = dedupeImportCandidates(rows);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].memberId).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    expect(deduped[0].alreadyInTargetSpace).toBe(true);
    expect(deduped[0].availableForMoveIn).toBe(true);
  });

  it('does not treat directory-style ids as memberId', () => {
    const rows = [
      candidate({
        memberId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        mobileNumber: '9000000502',
        fullName: 'Arjun Rao',
        sourceSpaceName: 'Shree Apartments',
      }),
    ];
    const [item] = mapImportCandidatesToPickerItems(rows, { includeUnavailable: true });
    expect(item.memberId).toBe('cccccccc-cccc-cccc-cccc-cccccccccccc');
    expect(String(item.memberId)).not.toMatch(/^u:/);
    expect(String(item.memberId)).not.toMatch(/^m:/);
  });
});
