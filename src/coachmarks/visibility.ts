import type { LifecycleState } from '../spaceLifecycle/types';
import type { CoachmarkTourId } from '../utils/coachmarkStorage';

/** Kill switch — set false to disable all setup coachmarks without removing code. */
export const ENABLE_SETUP_COACHMARKS = true;

/**
 * Coachmarks only for first-time setup orientation.
 * READY / ACTIVE / NEEDS_ATTENTION never auto-start (replay is future).
 */
export function isCoachmarkLifecycleEligible(
  lifecycle: LifecycleState | null | undefined,
): boolean {
  return lifecycle === 'NEW' || lifecycle === 'SETUP_IN_PROGRESS';
}

export type CoachmarkStartEligibilityInput = {
  enabled?: boolean;
  lifecycle: LifecycleState | null | undefined;
  /** Already completed or skipped in storage. */
  alreadyFinished: boolean;
  /** Force start (future Replay Tips). */
  forceReplay?: boolean;
};

export function canStartCoachmark({
  enabled = true,
  lifecycle,
  alreadyFinished,
  forceReplay = false,
}: CoachmarkStartEligibilityInput): boolean {
  if (!ENABLE_SETUP_COACHMARKS || !enabled) {
    return false;
  }
  if (forceReplay) {
    return true;
  }
  if (alreadyFinished) {
    return false;
  }
  return isCoachmarkLifecycleEligible(lifecycle);
}

export function defaultTourIdForSpace(isMess: boolean): CoachmarkTourId {
  return isMess ? 'setup.mess.v1' : 'setup.accommodation.v1';
}
