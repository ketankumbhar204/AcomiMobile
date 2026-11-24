import { useCallback, useEffect, useRef, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type { UUID } from '../api/types';
import { getMembershipErrorMessage } from '../utils/membershipErrors';
import {
  mapImportCandidatesToPickerItems,
  type ResidentPickerItem,
} from '../utils/residentImportCandidates';

export type { ResidentPickerItem };

const DEBOUNCE_MS = 300;

type UseResidentImportSearchOptions = {
  enabled?: boolean;
  /**
   * When false (default for Mess Add Customer), hide busy lodging rows.
   * Move In passes true so All My Spaces people remain discoverable, while
   * MemberPickerStep disables rows with availableForMoveIn=false.
   */
  includeUnavailable?: boolean;
};

/**
 * Cross-space eligible resident search for ALLOCATE / RESERVE member picker
 * and Mess customer reuse. Uses GET /spaces/{id}/members/import-candidates.
 */
export function useResidentImportSearch(
  spaceId: UUID,
  query: string,
  options: UseResidentImportSearchOptions = {},
) {
  const { enabled = true, includeUnavailable = false } = options;
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
      setMembers(mapImportCandidatesToPickerItems(data, { includeUnavailable }));
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
  }, [includeUnavailable, query, spaceId]);

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
