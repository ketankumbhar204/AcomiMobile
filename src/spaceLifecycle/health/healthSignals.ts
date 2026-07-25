import type { CalculateSpaceHealthInput, HealthSignals } from './types';

/** Normalize lifecycle + dashboard extras into one signal bag for scoring. */
export function buildHealthSignals(
  input: CalculateSpaceHealthInput,
): HealthSignals {
  const { evaluation, context, extras } = input;
  const occupied = Math.max(0, extras?.occupiedBeds ?? 0);
  const vacant = Math.max(0, extras?.vacantBeds ?? 0);
  const bedTotal =
    occupied + vacant > 0
      ? occupied + vacant
      : Math.max(0, context.bedCount);

  return {
    lifecycle: evaluation.lifecycle,
    progress: evaluation.progress,
    recommendation: evaluation.recommendation,
    pendingActionCount: Math.max(0, context.pendingActionCount),
    memberCount: Math.max(0, context.memberCount),
    hasMealLibrary: context.hasMealLibrary,
    hasTodaysMenuPlanned: context.hasTodaysMenuPlanned,
    hasMenuShared: context.hasMenuShared,
    hasOperationalSignal: context.hasOperationalSignal,
    isMess: evaluation.spaceType === 'MESS',
    occupiedBeds: occupied,
    vacantBeds: vacant,
    bedTotal,
    underReviewPaymentCount: Math.max(
      0,
      extras?.underReviewPaymentCount ?? 0,
    ),
    buildingCount: Math.max(0, context.buildingCount),
  };
}

/**
 * Health appears after initial setup has meaningful progress,
 * or once the space is READY / ACTIVE / NEEDS_ATTENTION.
 * Avoids showing a vanity 0% on brand-new spaces.
 */
export function isHealthScoreAvailable(signals: HealthSignals): boolean {
  const { lifecycle, progress } = signals;
  if (
    lifecycle === 'READY' ||
    lifecycle === 'ACTIVE' ||
    lifecycle === 'NEEDS_ATTENTION'
  ) {
    return true;
  }
  // NEW / SETUP: need more than “space created” alone when other required steps exist
  if (progress.requiredTotal <= 1) {
    return progress.requiredCompleted >= 1;
  }
  return progress.requiredCompleted > 1;
}
