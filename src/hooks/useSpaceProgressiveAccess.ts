import { useMemo } from 'react';
import type { UUID } from '../api/types';
import { useSpacePermissions } from './useSpacePermissions';
import { useSpaceLifecycle } from './useSpaceLifecycle';
import { useSpaceLifecycleSignals } from './useSpaceLifecycleSignals';
import { canManageNotifications } from '../utils/spaceOperator';
import type {
  CapabilityAccess,
  CapabilityId,
  SpaceCapabilitiesResult,
} from '../spaceLifecycle';

export type UseSpaceProgressiveAccessResult = {
  loading: boolean;
  capabilities: SpaceCapabilitiesResult | null;
  getCapability: (id: CapabilityId) => CapabilityAccess | null;
  spaceType: ReturnType<typeof useSpacePermissions>['spaceType'];
};

/**
 * Shared progressive-access evaluation for tabs and screens.
 * Reuses lifecycle signals — safe for operators; consumers get no LOCKED modes.
 */
export function useSpaceProgressiveAccess(
  spaceId: UUID | null | undefined,
): UseSpaceProgressiveAccessResult {
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType;
  const enabled = Boolean(spaceId) && canManageNotifications(permissions);

  const { context, loading } = useSpaceLifecycleSignals({
    spaceId: spaceId ?? null,
    spaceType,
    permissions,
    enabled,
    pendingActionCount: 0,
    hasOperationalSignal: false,
  });

  const { capabilities, getCapability } = useSpaceLifecycle({
    spaceType,
    context: enabled ? context : null,
    enabled,
  });

  return useMemo(
    () => ({
      loading: enabled && loading,
      capabilities,
      getCapability,
      spaceType,
    }),
    [capabilities, enabled, getCapability, loading, spaceType],
  );
}
