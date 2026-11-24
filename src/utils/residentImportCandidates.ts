import type {
  MemberImportCandidateResponse,
  MemberResponse,
  UUID,
} from '../api/types';

export type ResidentPickerItem = MemberResponse & {
  sourceSpaceId?: UUID;
  sourceSpaceName?: string;
  alreadyInTargetSpace?: boolean;
  availableForMoveIn?: boolean;
  needsImport?: boolean;
};

export function candidateToPickerItem(
  candidate: MemberImportCandidateResponse,
): ResidentPickerItem {
  return {
    memberId: candidate.memberId,
    fullName: candidate.fullName,
    mobileNumber: candidate.mobileNumber,
    role: candidate.role,
    linkedUser: false,
    status: candidate.status,
    occupancyStatus: candidate.occupancyStatus,
    gender: candidate.gender,
    createdAt: candidate.createdAt,
    sourceSpaceId: candidate.sourceSpaceId,
    sourceSpaceName: candidate.sourceSpaceName,
    alreadyInTargetSpace: candidate.alreadyInTargetSpace,
    availableForMoveIn: candidate.availableForMoveIn,
    needsImport: !candidate.alreadyInTargetSpace,
  };
}

function normalizeMobile(mobile: string | null | undefined): string {
  return (mobile ?? '').replace(/\D/g, '');
}

function preferCandidate(
  candidate: MemberImportCandidateResponse,
  existing: MemberImportCandidateResponse,
): boolean {
  if (candidate.availableForMoveIn !== existing.availableForMoveIn) {
    return candidate.availableForMoveIn;
  }
  if (candidate.alreadyInTargetSpace !== existing.alreadyInTargetSpace) {
    return candidate.alreadyInTargetSpace;
  }
  return false;
}

/**
 * One picker row per person (mobile), aligned with owner directory identity.
 * Prefers move-in-eligible, then already-in-destination association.
 */
export function dedupeImportCandidates(
  candidates: MemberImportCandidateResponse[],
): MemberImportCandidateResponse[] {
  const byMobile = new Map<string, MemberImportCandidateResponse>();
  for (const candidate of candidates) {
    const key = normalizeMobile(candidate.mobileNumber) || candidate.memberId;
    const existing = byMobile.get(key);
    if (!existing || preferCandidate(candidate, existing)) {
      byMobile.set(key, candidate);
    }
  }
  return [...byMobile.values()];
}

/**
 * Display order for Move In search. Eligibility comes only from `availableForMoveIn`.
 * 0 available with no current stay, 1 already in this space and eligible,
 * 2 active or reserved stay elsewhere and still eligible,
 * 3 active or reserved in the destination, 4 other ineligible.
 */
export function moveInPickerRank(item: {
  availableForMoveIn?: boolean;
  alreadyInTargetSpace?: boolean;
  occupancyStatus?: string | null;
}): number {
  const available = item.availableForMoveIn === true;
  const inTarget = item.alreadyInTargetSpace === true;
  const stayElsewhere =
    !inTarget &&
    (item.occupancyStatus === 'ALLOCATED' || item.occupancyStatus === 'RESERVED');
  if (available && !inTarget && !stayElsewhere) {
    return 0;
  }
  if (available && inTarget) {
    return 1;
  }
  if (available && stayElsewhere) {
    return 2;
  }
  if (!available && inTarget) {
    return 3;
  }
  return 4;
}

export function compareMoveInPickerItems<
  T extends {
    fullName?: string | null;
    availableForMoveIn?: boolean;
    alreadyInTargetSpace?: boolean;
    occupancyStatus?: string | null;
  },
>(left: T, right: T): number {
  const rank = moveInPickerRank(left) - moveInPickerRank(right);
  if (rank !== 0) {
    return rank;
  }
  return (left.fullName ?? '').localeCompare(right.fullName ?? '', undefined, {
    sensitivity: 'base',
  });
}

export function mapImportCandidatesToPickerItems(
  candidates: MemberImportCandidateResponse[],
  options: { includeUnavailable?: boolean } = {},
): ResidentPickerItem[] {
  const { includeUnavailable = false } = options;
  return dedupeImportCandidates(candidates)
    .filter(item => includeUnavailable || item.availableForMoveIn)
    .map(candidateToPickerItem)
    .sort(compareMoveInPickerItems);
}
