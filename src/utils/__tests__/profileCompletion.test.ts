import {
  isGenericUserName,
  isUserProfileComplete,
  requiresProfileCompletion,
  userHasConsumerMembership,
} from '../profileCompletion';
import type { MySpaceResponse, UserResponse } from '../../api/types';

const completeUser: UserResponse = {
  id: 'u1',
  mobileNumber: '9999999999',
  fullName: 'John Doe',
  profilePhotoUrl: 'https://example.com/photo.jpg',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  permanentAddress: '123 Main St',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  profileCompleted: true,
  profileStatus: 'COMPLETED',
};

describe('profileCompletion', () => {
  it('detects generic placeholder names', () => {
    expect(isGenericUserName('User')).toBe(true);
    expect(isGenericUserName('John Doe')).toBe(false);
  });

  it('requires completion for tenant/customer with incomplete profile', () => {
    const spaces: MySpaceResponse[] = [
      {
        spaceId: 's1',
        spaceName: 'Test PG',
        spaceType: 'PG',
        membershipRole: 'TENANT',
        joinedAt: '2026-01-01T00:00:00Z',
      },
    ];

    expect(
      requiresProfileCompletion(
        {
          ...completeUser,
          profileCompleted: false,
          profileStatus: 'PENDING',
          fullName: 'User',
          profilePhotoUrl: null,
          permanentAddress: null,
          city: null,
          state: null,
          pincode: null,
        },
        spaces,
      ),
    ).toBe(true);

    expect(requiresProfileCompletion(completeUser, spaces)).toBe(false);
    expect(requiresProfileCompletion(completeUser, [])).toBe(false);
  });

  it('treats profileCompleted flag as authoritative', () => {
    expect(isUserProfileComplete(completeUser)).toBe(true);
  });

  it('identifies consumer memberships', () => {
    expect(
      userHasConsumerMembership([
        {
          spaceId: 's1',
          spaceName: 'Mess',
          spaceType: 'MESS',
          membershipRole: 'CUSTOMER',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ]),
    ).toBe(true);
  });
});
