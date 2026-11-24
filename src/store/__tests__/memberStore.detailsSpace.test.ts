const activeSpaceId = '11111111-1111-1111-1111-111111111111';
const otherSpaceId = '22222222-2222-2222-2222-222222222222';
const memberId = 'ccc1c4f3-516f-4147-9610-4ee3a3f44c07';

jest.mock('../../api/memberApi', () => ({
  memberApi: {
    getMember: jest.fn(),
    getPendingInvitations: jest.fn(),
  },
  PENDING_UPLOAD_FILE_URL: 'pending-upload',
}));

jest.mock('../../utils/membershipErrors', () => ({
  getMembershipErrorMessage: (_err: unknown, key: string) => key,
}));

jest.mock('../authStore', () => ({
  useAuthStore: {
    getState: () => ({ userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }),
  },
}));

jest.mock('../spaceStore', () => ({
  useSpaceStore: {
    getState: () => ({
      currentSpace: {
        spaceId: activeSpaceId,
        spaceName: 'Sai Residency PG',
        spaceType: 'PG',
      },
    }),
  },
}));

import { memberApi } from '../../api/memberApi';
import { useMemberStore } from '../memberStore';

describe('memberStore details space binding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMemberStore.getState().reset();
  });

  it('loads member details from the route association space, not the active space', async () => {
    (memberApi.getMember as jest.Mock).mockResolvedValue({
      memberId,
      fullName: 'Demo · Dev Rao',
      mobileNumber: '9000000504',
      role: 'CUSTOMER',
      linkedUser: true,
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00Z',
    });

    const result = await useMemberStore.getState().loadMemberDetails(memberId, otherSpaceId);

    expect(memberApi.getMember).toHaveBeenCalledWith(otherSpaceId, memberId);
    expect(memberApi.getMember).not.toHaveBeenCalledWith(activeSpaceId, memberId);
    expect(result?.memberId).toBe(memberId);
    expect(useMemberStore.getState().selectedMemberSpaceId).toBe(otherSpaceId);
  });

  it('does not treat directoryId as memberId', async () => {
    (memberApi.getMember as jest.Mock).mockResolvedValue({
      memberId,
      fullName: 'Arjun Rao',
      mobileNumber: '9000000001',
      role: 'TENANT',
      linkedUser: true,
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00Z',
    });

    await useMemberStore.getState().loadMemberDetails(memberId, otherSpaceId);

    const [calledSpaceId, calledMemberId] = (memberApi.getMember as jest.Mock).mock.calls[0];
    expect(calledSpaceId).toBe(otherSpaceId);
    expect(calledMemberId).toBe(memberId);
    expect(String(calledMemberId)).not.toMatch(/^u:/);
    expect(String(calledMemberId)).not.toMatch(/^m:/);
  });
});
