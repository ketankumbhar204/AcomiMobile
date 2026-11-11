import type { MealHeadcountDetailResponse } from '../api/types';

export type MealResponseFilter = 'eligible' | 'responded' | 'not_responded';

export type MealResponseMemberRow = {
  memberId: string;
  memberName: string;
  mobileNumber: string | null;
  /** Chosen menu option when this member has responded. */
  choice: string | null;
  /** Menu option ids this member selected (supports multi-select). */
  optionIds: string[];
  responded: boolean;
};

export type MealResponseLists = {
  eligible: MealResponseMemberRow[];
  responded: MealResponseMemberRow[];
  notResponded: MealResponseMemberRow[];
};

export type MealResponseOptionChip = {
  optionId: string;
  label: string;
  count: number;
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
    const optionId = option.optionId?.trim() || '';
    for (const member of option.members ?? []) {
      const existing = respondedById.get(member.memberId);
      if (!existing) {
        respondedById.set(member.memberId, {
          memberId: member.memberId,
          memberName: member.memberName?.trim() || 'Member',
          mobileNumber: member.mobileNumber?.trim() || null,
          choice,
          optionIds: optionId ? [optionId] : [],
          responded: true,
        });
        continue;
      }
      if (optionId && !existing.optionIds.includes(optionId)) {
        existing.optionIds.push(optionId);
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
      optionIds: [] as string[],
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

/** Menu/combo chips for packaging filters. Prefers MENU_ENTRY; keeps others with counts. */
export function buildMealResponseOptionChips(
  detail: MealHeadcountDetailResponse | null | undefined,
): MealResponseOptionChip[] {
  return (detail?.options ?? [])
    .filter(option => (option.members?.length ?? 0) > 0 || (option.count ?? 0) > 0)
    .map(option => ({
      optionId: option.optionId,
      label: option.label?.trim() || 'Option',
      count: option.members?.length ?? option.count ?? 0,
    }))
    .filter(chip => chip.optionId && chip.count > 0);
}

export function matchesMealResponseOption(
  row: MealResponseMemberRow,
  optionId: string | 'all' | null | undefined,
): boolean {
  if (!optionId || optionId === 'all') {
    return true;
  }
  return row.optionIds.includes(optionId);
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
