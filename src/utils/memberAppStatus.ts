type MemberCountInFields = {
  membershipId?: string | null;
  linkedUser?: boolean;
};

export function isMemberOnCountIn(member: MemberCountInFields): boolean {
  return member.membershipId != null;
}

export type MemberCountInBadgeKey = 'onCountIn' | 'notOnCountInYet';

export function getMemberCountInBadgeKey(member: MemberCountInFields): MemberCountInBadgeKey {
  return isMemberOnCountIn(member) ? 'onCountIn' : 'notOnCountInYet';
}

export type MemberInviteHintKey = 'hintNewToCountIn' | 'hintAlreadyOnCountIn';

export function getMemberInviteHintKey(
  member: Pick<MemberCountInFields, 'linkedUser'>,
): MemberInviteHintKey {
  return member.linkedUser ? 'hintAlreadyOnCountIn' : 'hintNewToCountIn';
}

export function memberCountInBadgeLabel(
  member: MemberCountInFields,
  t: (key: string) => string,
): string {
  const key = getMemberCountInBadgeKey(member);
  return t(`membership.members.${key}`);
}

export function memberInviteHint(
  member: Pick<MemberCountInFields, 'linkedUser'> & { mobileNumber: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const hintKey = getMemberInviteHintKey(member);
  return t(`membership.invite.${hintKey}`, { mobile: member.mobileNumber });
}
