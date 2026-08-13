type MemberAcomiFields = {
  membershipId?: string | null;
  linkedUser?: boolean;
};

export function isMemberOnAcomi(member: MemberAcomiFields): boolean {
  return member.membershipId != null;
}

export type MemberAcomiBadgeKey = 'onAcomi' | 'notOnAcomiYet';

export function getMemberAcomiBadgeKey(member: MemberAcomiFields): MemberAcomiBadgeKey {
  return isMemberOnAcomi(member) ? 'onAcomi' : 'notOnAcomiYet';
}

export type MemberInviteHintKey = 'hintNewToAcomi' | 'hintAlreadyOnAcomi';

export function getMemberInviteHintKey(
  member: Pick<MemberAcomiFields, 'linkedUser'>,
): MemberInviteHintKey {
  return member.linkedUser ? 'hintAlreadyOnAcomi' : 'hintNewToAcomi';
}

export function memberAcomiBadgeLabel(
  member: MemberAcomiFields,
  t: (key: string) => string,
): string {
  const key = getMemberAcomiBadgeKey(member);
  return t(`membership.members.${key}`);
}

export function memberInviteHint(
  member: Pick<MemberAcomiFields, 'linkedUser'> & { mobileNumber: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const hintKey = getMemberInviteHintKey(member);
  return t(`membership.invite.${hintKey}`, { mobile: member.mobileNumber });
}
