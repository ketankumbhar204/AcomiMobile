import { useCallback, useEffect, useRef, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type { MemberImportCandidateResponse, MemberResponse, UUID } from '../api/types';
import { getMembershipErrorMessage } from '../utils/membershipErrors';

const DEBOUNCE_MS = 300;

export type ResidentPickerItem = MemberResponse & {
  sourceSpaceId?: UUID;
  sourceSpaceName?: string;
  alreadyInTargetSpace?: boolean;
  availableForMoveIn?: boolean;
  needsImport?: boolean;
};

function candidateToPickerItem(candidate: MemberImportCandidateResponse): ResidentPickerItem {
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

type UseResidentImportSearchOptions = {
  enabled?: boolean;
};

/**
 * Cross-space eligible resident search for ALLOCATE / RESERVE member picker.
 * Uses GET /spaces/{id}/members/import-candidates.
 */
export function useResidentImportSearch(
  spaceId: UUID,
  query: string,
  options: UseResidentImportSearchOptions = {},
) {
  const { enabled = true } = options;
  const [members, setMembers] = useState<ResidentPickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCandidates = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const data = await memberApi.searchImportCandidates(spaceId, query.trim() || undefined);
      if (seq !== requestSeq.current) {
        return;
      }
      setMembers(
        data
          .filter(item => item.availableForMoveIn)
          .map(candidateToPickerItem),
      );
    } catch (err) {
      if (seq !== requestSeq.current) {
        return;
      }
      setError(getMembershipErrorMessage(err, 'occupancyWizard.errors.searchMembers'));
      setMembers([]);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [query, spaceId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchCandidates();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, fetchCandidates]);

  const reset = useCallback(() => {
    requestSeq.current += 1;
    setMembers([]);
    setError(null);
  }, []);

  return { members, loading, error, reset, refetch: fetchCandidates };
}
