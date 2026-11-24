export type ImportCandidateEligibility = {
  availableForMoveIn?: boolean;
  alreadyInTargetSpace?: boolean;
};

/**
 * People the import screen can add.
 * Someone already in the destination stays listed with Add hidden.
 * An active stay in another space can still be copied; move-in uses availableForMoveIn.
 */
export function isImportableCandidate(candidate: ImportCandidateEligibility): boolean {
  return candidate.alreadyInTargetSpace !== true;
}

export function countImportableCandidates(
  candidates: readonly ImportCandidateEligibility[],
): number {
  return candidates.reduce(
    (count, candidate) => count + (isImportableCandidate(candidate) ? 1 : 0),
    0,
  );
}

/** Choice sheet only when "use existing" would not be an empty list. */
export function shouldOfferImportChoice(importableCount: number): boolean {
  return importableCount > 0;
}

export type AddPersonNoun = 'customer' | 'member';

export type AddPersonEntry = 'new' | 'import';

export type AddPersonDestination = { type: 'form'; pickerMode: 'new' | 'search' };

/**
 * Only Mess offers "Use existing…" (cross-space search inside Add Member).
 * Lodging adds new people directly; existing residents come in through Move-in.
 */
export function offersUseExistingChoice(spaceType: string | undefined): boolean {
  return spaceType === 'MESS';
}

/** Mess spaces speak about customers. Other spaces speak about members. */
export function addPersonNoun(spaceType: string | undefined): AddPersonNoun {
  return spaceType === 'MESS' ? 'customer' : 'member';
}

/**
 * Which Add Member form mode to open after the choice.
 * Mess "use existing" opens the cross-space search picker inside Add Member.
 * Lodging never navigates to Import Existing People: it always opens the new-person form.
 */
export function destinationForAddPersonChoice(
  spaceType: string | undefined,
  entry: AddPersonEntry,
): AddPersonDestination {
  if (entry === 'new') {
    return { type: 'form', pickerMode: 'new' };
  }
  if (offersUseExistingChoice(spaceType)) {
    return { type: 'form', pickerMode: 'search' };
  }
  return { type: 'form', pickerMode: 'new' };
}
