import type { MemberGender, SpaceType } from '../api/types';

export const MEMBER_GENDER_OPTIONS: MemberGender[] = ['MALE', 'FEMALE', 'OTHER'];

export function isMemberGenderRequired(spaceType?: SpaceType): boolean {
  return spaceType === 'PG' || spaceType === 'HOSTEL';
}

export function memberGenderLabelKey(gender: MemberGender): string {
  return `membership.gender.${gender.toLowerCase()}`;
}

export function isSelectableMemberGender(
  gender?: MemberGender | null,
): gender is MemberGender {
  return gender != null && gender !== 'UNSPECIFIED';
}
