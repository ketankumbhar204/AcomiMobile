import type { LifecycleState, PredicateContext, SetupProgressSnapshot } from './types';

/**
 * Derive lifecycle state from required-setup completion + attention + ops signal.
 * Phase 0 default: ACTIVE soft-equals READY when hasOperationalSignal is true
 * (callers may pass true on first READY visit in Phase 2).
 *
 * NEEDS_ATTENTION overlays when pendingActionCount > 0 and required setup is done.
 * During SETUP, pending actions do not change the primary lifecycle away from SETUP
 * (bell still works independently).
 */
export function deriveLifecycleState(
  progress: SetupProgressSnapshot,
  ctx: PredicateContext,
): LifecycleState {
  const requiredIncomplete = !progress.isRequiredComplete;

  if (requiredIncomplete) {
    const onlySpaceCreated =
      progress.requiredCompleted <= 1 &&
      progress.completedMilestoneIds.length <= 1 &&
      progress.completedMilestoneIds[0] === 'SPACE_CREATED';

    // Lodging: no buildings + no members. Mess: no library + no customers.
    const stillPristine =
      ctx.spaceType === 'MESS'
        ? !ctx.hasMealLibrary && ctx.memberCount === 0 && !ctx.hasTodaysMenuPlanned
        : ctx.buildingCount === 0 && ctx.memberCount === 0;

    if (onlySpaceCreated && stillPristine) {
      return 'NEW';
    }
    return 'SETUP_IN_PROGRESS';
  }

  if (ctx.pendingActionCount > 0) {
    return 'NEEDS_ATTENTION';
  }

  if (ctx.hasOperationalSignal) {
    return 'ACTIVE';
  }

  return 'READY';
}
