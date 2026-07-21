import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { MembershipRole, UUID } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import { filterTenantVisiblePendingActions } from '../utils/ownerOnlyNotifications';
import { fetchPendingActionsCached } from '../utils/pendingActionsQueryCache';
import {
  buildSpaceAttentionSummary,
  type SpaceAttentionSummary,
} from '../utils/spaceAttentionSummary';
import { isConsumerMembershipRole } from '../utils/profileCompletion';

type SpaceRef = {
  spaceId: UUID;
  membershipRole: MembershipRole;
};

const CONCURRENCY = 3;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

/**
 * Loads tenant-visible pending-action summaries for customer/tenant spaces only.
 * Owner/manager spaces are ignored so operator global-dashboard paths stay unchanged.
 */
export function useConsumerSpacesAttention(spaces: SpaceRef[], enabled: boolean) {
  const month = currentMonthKey();
  const consumerSpaceIds = useMemo(
    () =>
      spaces
        .filter(space => isConsumerMembershipRole(space.membershipRole))
        .map(space => space.spaceId),
    [spaces],
  );
  const spaceIdsKey = consumerSpaceIds.join(',');

  const [bySpaceId, setBySpaceId] = useState<Record<string, SpaceAttentionSummary>>({});
  const [loading, setLoading] = useState(false);

  const reload = useCallback(
    async (force = false) => {
      if (!enabled || consumerSpaceIds.length === 0) {
        setBySpaceId({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rows = await mapPool(consumerSpaceIds, CONCURRENCY, async spaceId => {
          try {
            const raw = await fetchPendingActionsCached(spaceId, month, { force });
            const filtered = filterTenantVisiblePendingActions(raw);
            return {
              spaceId,
              summary: buildSpaceAttentionSummary(filtered),
            };
          } catch {
            return {
              spaceId,
              summary: {
                totalCount: 0,
                items: [],
                primary: null,
                moreCount: 0,
              } satisfies SpaceAttentionSummary,
            };
          }
        });

        const next: Record<string, SpaceAttentionSummary> = {};
        for (const row of rows) {
          next[row.spaceId] = row.summary;
        }
        setBySpaceId(next);
      } finally {
        setLoading(false);
      }
    },
    [consumerSpaceIds, enabled, month],
  );

  useFocusEffect(
    useCallback(() => {
      void reload(false);
    }, [reload]),
  );

  // When membership list changes while already focused, refresh without waiting for blur/focus.
  const skipSpaceIdsEffect = useRef(true);
  useEffect(() => {
    if (skipSpaceIdsEffect.current) {
      skipSpaceIdsEffect.current = false;
      return;
    }
    void reload(false);
  }, [reload, spaceIdsKey]);

  return {
    bySpaceId,
    loading,
    reload,
    hasConsumerSpaces: consumerSpaceIds.length > 0,
  };
}
