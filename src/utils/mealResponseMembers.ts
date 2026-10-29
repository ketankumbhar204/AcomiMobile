import type { MealHeadcountDetailResponse } from '../api/types';

export type MealResponseFilter = 'eligible' | 'responded' | 'not_responded';

export type MealResponseMemberRow = {
  memberId: string;
  memberName: string;
  mobileNumber: string | null;
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
          mobileNumber: member.mobileNumber?.trim() || null,
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
      mobileNumber: member.mobileNumber?.trim() || null,
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

/** Client-side match against a name or mobile already on the row. */
export function matchesMealResponseSearch(row: MealResponseMemberRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (row.memberName.toLowerCase().includes(q)) {
    return true;
  }
  const mobile = row.mobileNumber ?? '';
  if (mobile.toLowerCase().includes(q)) {
    return true;
  }
  const digits = q.replace(/\D/g, '');
  if (!digits) {
    return false;
  }
  const stored = mobile.replace(/\D/g, '');
  if (stored.includes(digits)) {
    return true;
  }
  const withoutCountry = digits.startsWith('91') ? digits.slice(2) : digits.replace(/^0+/, '');
  return withoutCountry.length > 0 && stored.includes(withoutCountry);
}

/**
 * Badge for the card. Responded comes from the row, not from the meal name.
 * Eligible vs not-responded follows the list the member is being viewed in.
 */
export function mealResponseCardStatus(
  row: MealResponseMemberRow,
  filter: MealResponseFilter,
): MealResponseFilter {
  if (row.responded) {
    return 'responded';
  }
  return filter === 'not_responded' ? 'not_responded' : 'eligible';
}
