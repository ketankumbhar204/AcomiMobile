type MemberAmicoFields = {
  membershipId?: string | null;
  linkedUser?: boolean;
};

export function isMemberOnAmico(member: MemberAmicoFields): boolean {
  return member.membershipId != null;
}

export type MemberAmicoBadgeKey = 'onAmico' | 'notOnAmicoYet';

export function getMemberAmicoBadgeKey(member: MemberAmicoFields): MemberAmicoBadgeKey {
  return isMemberOnAmico(member) ? 'onAmico' : 'notOnAmicoYet';
}

export type MemberInviteHintKey = 'hintNewToAmico' | 'hintAlreadyOnAmico';

export function getMemberInviteHintKey(
  member: Pick<MemberAmicoFields, 'linkedUser'>,
): MemberInviteHintKey {
  return member.linkedUser ? 'hintAlreadyOnAmico' : 'hintNewToAmico';
}

export function memberAmicoBadgeLabel(
  member: MemberAmicoFields,
  t: (key: string) => string,
): string {
  const key = getMemberAmicoBadgeKey(member);
  return t(`membership.members.${key}`);
}

export function memberInviteHint(
  member: Pick<MemberAmicoFields, 'linkedUser'> & { mobileNumber: string },
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const hintKey = getMemberInviteHintKey(member);
  return t(`membership.invite.${hintKey}`, { mobile: member.mobileNumber });
}
