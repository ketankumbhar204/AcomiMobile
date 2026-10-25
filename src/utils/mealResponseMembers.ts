import type { MealHeadcountDetailResponse } from '../api/types';

export type MealResponseFilter = 'eligible' | 'responded' | 'not_responded';

export type MealResponseMemberRow = {
  memberId: string;
  memberName: string;
  /** Chosen menu option when this member has responded. */
  choice: string | null;
  responded: boolean;
};

export type MealResponseLists = {
  eligible: MealResponseMemberRow[];
  responded: MealResponseMemberRow[];
  notResponded: MealResponseMemberRow[];
};

function byName(a: MealResponseMemberRow, b: MealResponseMemberRow): number {
  return a.memberName.localeCompare(b.memberName);
}

/**
 * Splits one shared meal's headcount into eligible, responded, and not-responded members.
 * A member who picked any option, including "not available", counts as responded.
 */
export function buildMealResponseLists(
  detail: MealHeadcountDetailResponse | null | undefined,
): MealResponseLists {
  const respondedById = new Map<string, MealResponseMemberRow>();
  for (const option of detail?.options ?? []) {
    const choice = option.label?.trim() || null;
    for (const member of option.members ?? []) {
      const existing = respondedById.get(member.memberId);
      if (!existing) {
        respondedById.set(member.memberId, {
          memberId: member.memberId,
          memberName: member.memberName?.trim() || 'Member',
          choice,
          responded: true,
        });
        continue;
      }
      if (choice && existing.choice && !existing.choice.split(', ').includes(choice)) {
        existing.choice = `${existing.choice}, ${choice}`;
      } else if (choice && !existing.choice) {
        existing.choice = choice;
      }
    }
  }

  const responded = [...respondedById.values()].sort(byName);
  const respondedIds = new Set(responded.map(row => row.memberId));
  const notResponded = (detail?.noResponseMembers ?? [])
    .filter(member => !respondedIds.has(member.memberId))
    .map(member => ({
      memberId: member.memberId,
      memberName: member.memberName?.trim() || 'Member',
      choice: null,
      responded: false,
    }))
    .sort(byName);

  const eligibleById = new Map<string, MealResponseMemberRow>();
  for (const row of [...responded, ...notResponded]) {
    if (!eligibleById.has(row.memberId)) {
      eligibleById.set(row.memberId, row);
    }
  }

  return {
    eligible: [...eligibleById.values()].sort(byName),
    responded,
    notResponded,
  };
}
