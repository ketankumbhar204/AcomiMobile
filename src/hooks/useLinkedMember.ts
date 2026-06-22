import { useCallback, useEffect, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type { MemberResponse, UUID } from '../api/types';
import { useAuthStore } from '../store/authStore';

/**
 * Resolves the member record linked to the signed-in user within a space.
 * Used for TENANT "My stay" flows and CUSTOMER meal flows.
 */
export function useLinkedMember(spaceId: UUID | null | undefined) {
  const userId = useAuthStore(state => state.userId);
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!spaceId || !userId) {
      setMember(null);
      return null;
    }

    setLoading(true);
    try {
      const linked = await memberApi.getMyLinkedMember(spaceId);
      setMember(linked);
      return linked;
    } catch {
      try {
        const members = await memberApi.getMembers(spaceId);
        const fallback = members.find(item => item.linkedUserId === userId) ?? null;
        setMember(fallback);
        return fallback;
      } catch {
        setMember(null);
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, [spaceId, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { member, memberId: member?.memberId ?? null, loading, refresh };
}
