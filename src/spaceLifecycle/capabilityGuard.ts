import type { CapabilityAccess, CapabilityId, SpaceCapabilitiesResult } from './capabilities';
import { getCapability } from './capabilities';

/**
 * Pure guard helper for deep links / stack screens.
 * Returns null when navigation may proceed; otherwise the blocking capability access.
 *
 * SOFT and AVAILABLE both allow entry (SOFT shows in-screen guidance).
 * HIDDEN and LOCKED block progressive operator entry.
 */
export function getBlockingCapability(
  capabilities: SpaceCapabilitiesResult | null | undefined,
  id: CapabilityId,
): CapabilityAccess | null {
  if (!capabilities) {
    return null;
  }
  const access = getCapability(capabilities, id);
  if (access.mode === 'LOCKED' || access.mode === 'HIDDEN') {
    return access;
  }
  return null;
}
