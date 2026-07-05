import type {
  MembershipRole,
  MySpaceResponse,
  ProfileStatus,
  UserResponse,
} from '../api/types';

const GENERIC_USER_NAMES = new Set(['user', 'guest', 'new user']);

export function isGenericUserName(fullName: string | null | undefined): boolean {
  const normalized = fullName?.trim().toLowerCase() ?? '';
  return !normalized || GENERIC_USER_NAMES.has(normalized);
}

export function isConsumerMembershipRole(role: MembershipRole | undefined): boolean {
  return role === 'TENANT' || role === 'CUSTOMER';
}

export function userHasConsumerMembership(
  mySpaces: MySpaceResponse[] | undefined,
): boolean {
  return (mySpaces ?? []).some(space => isConsumerMembershipRole(space.membershipRole));
}

export function isProfileStatusComplete(status: ProfileStatus | null | undefined): boolean {
  return status === 'COMPLETED' || status === 'VERIFIED';
}

export function isUserProfileComplete(user: UserResponse | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (user.profileCompleted === true) {
    return true;
  }

  if (isProfileStatusComplete(user.profileStatus)) {
    return true;
  }

  if (isGenericUserName(user.fullName)) {
    return false;
  }

  if (!user.permanentAddress?.trim()) {
    return false;
  }

  if (!user.city?.trim()) {
    return false;
  }

  if (!user.state?.trim()) {
    return false;
  }

  if (!user.pincode?.trim()) {
    return false;
  }

  return true;
}

export function requiresProfileCompletion(
  user: UserResponse | null | undefined,
  mySpaces: MySpaceResponse[] | undefined,
): boolean {
  if (!user || !userHasConsumerMembership(mySpaces)) {
    return false;
  }
  return !isUserProfileComplete(user);
}

export function profileCompletionPercentage(user: UserResponse | null | undefined): number {
  if (!user) {
    return 0;
  }

  if (typeof user.profileCompletionPercentage === 'number') {
    return Math.max(0, Math.min(100, user.profileCompletionPercentage));
  }

  const checks = [
    !isGenericUserName(user.fullName),
    Boolean(user.profilePhotoUrl?.trim()),
    Boolean(user.gender),
    Boolean(user.dateOfBirth?.trim()),
    Boolean(user.email?.trim()),
    Boolean(user.permanentAddress?.trim()),
    Boolean(user.city?.trim()),
    Boolean(user.state?.trim()),
    Boolean(user.pincode?.trim()),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}
