import { useCallback, useEffect, useRef, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type { MemberOccupancyStatus, MemberResponse, UUID } from '../api/types';
import { getMembershipErrorMessage } from '../utils/membershipErrors';
import { shouldShowOccupancySection } from '../utils/occupancyPermissions';

const DEBOUNCE_MS = 300;

type UseMemberSearchOptions = {
  occupancyStatus?: MemberOccupancyStatus;
  enabled?: boolean;
};

export function useMemberSearch(
  spaceId: UUID,
  query: string,
  options: UseMemberSearchOptions = {},
) {
  const { occupancyStatus, enabled = true } = options;
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMembers = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const data = await memberApi.getMembers(spaceId, {
        search: query.trim() || undefined,
        occupancyStatus,
      });
      if (seq !== requestSeq.current) {
        return;
      }
      setMembers(
        data.filter(
          member =>
            member.status === 'ACTIVE' && shouldShowOccupancySection(member.role),
        ),
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
  }, [occupancyStatus, query, spaceId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchMembers();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, fetchMembers]);

  const reset = useCallback(() => {
    requestSeq.current += 1;
    setMembers([]);
    setError(null);
  }, []);

  return { members, loading, error, reset };
}
