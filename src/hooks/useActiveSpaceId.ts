import { useMemo } from 'react';
import { useRoute } from '@react-navigation/native';
import type { UUID } from '../api/types';
import { useSpaceStore } from '../store/spaceStore';

/**
 * Resolves the authoritative spaceId for tab screens.
 * Route params from Tab.Navigator initialParams can go stale after a space
 * switch; the store's currentSpace is always the source of truth.
 */
export function useActiveSpaceId(fallbackSpaceId?: UUID | null): UUID {
  const route = useRoute();
  const routeSpaceId =
    (route.params as { spaceId?: UUID } | undefined)?.spaceId ?? fallbackSpaceId ?? '';
  const currentSpaceId = useSpaceStore(state => state.currentSpace?.spaceId);

  return useMemo(() => {
    if (currentSpaceId) {
      if (routeSpaceId && routeSpaceId !== currentSpaceId) {
        if (__DEV__) {
          console.warn('[useActiveSpaceId] stale route spaceId — using currentSpace', {
            routeSpaceId,
            currentSpaceId,
          });
        }
      }
      return currentSpaceId;
    }

    return routeSpaceId;
  }, [currentSpaceId, routeSpaceId]);
}
