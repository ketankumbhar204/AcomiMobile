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

/** Choice sheet only when import would not be an empty list. */
export function shouldOfferImportChoice(importableCount: number): boolean {
  return importableCount > 0;
}

export type AddPersonNoun = 'customer' | 'member';

export type AddPersonEntry = 'new' | 'import';

export type AddPersonDestination =
  | { type: 'form'; pickerMode: 'new' | 'search' }
  | { type: 'import-screen' };

/** Mess spaces speak about customers. Other spaces speak about members. */
export function addPersonNoun(spaceType: string | undefined): AddPersonNoun {
  return spaceType === 'MESS' ? 'customer' : 'member';
}

/**
 * Which existing screen to open after the choice sheet.
 * Mess import stays inside Add Member (the existing cross-space search).
 * Other spaces use the existing Import Existing People screen.
 */
export function destinationForAddPersonChoice(
  spaceType: string | undefined,
  entry: AddPersonEntry,
): AddPersonDestination {
  if (entry === 'new') {
    return { type: 'form', pickerMode: 'new' };
  }
  if (spaceType === 'MESS') {
    return { type: 'form', pickerMode: 'search' };
  }
  return { type: 'import-screen' };
}
