export function shouldOfferOtherSpaceShare(otherEligibleCount: number): boolean {
  return otherEligibleCount > 0;
}

export function defaultOtherSpaceIds(otherSpaces: readonly { spaceId: string }[]): string[] {
  return otherSpaces.map(space => space.spaceId);
}

export type OtherSpaceSelectAll = 'none' | 'some' | 'all';

/** Select-all applies to every eligible additional space, not a search filter. */
export function otherSpaceSelectAllState(
  eligibleIds: readonly string[],
  selectedIds: readonly string[],
): OtherSpaceSelectAll {
  const eligible = new Set(eligibleIds);
  const selected = selectedIds.filter(id => eligible.has(id));
  if (eligible.size === 0 || selected.length === 0) {
    return 'none';
  }
  if (selected.length === eligible.size) {
    return 'all';
  }
  return 'some';
}

export function nextOtherSpaceSelection(
  eligibleIds: readonly string[],
  selectedIds: readonly string[],
): string[] {
  return otherSpaceSelectAllState(eligibleIds, selectedIds) === 'all' ? [] : [...eligibleIds];
}

/** Additional destinations that are still eligible and still selected. */
export function selectedShareDestinations<T extends { spaceId: string }>(
  otherEligible: readonly T[],
  selectedIds: readonly string[],
): T[] {
  const selected = new Set(selectedIds);
  return otherEligible.filter(space => selected.has(space.spaceId));
}
