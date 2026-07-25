import { deriveLifecycleState } from './lifecycle';
import { evaluateMilestonePredicate, needsPropertyStructure } from './predicates';
import { setupProfileForSpaceType } from './profiles';
import { recommendNextAction } from './recommendation';
import type {
  EvaluateSpaceLifecycleInput,
  LifecycleEvaluationResult,
  MilestoneStatus,
  SetupProgressSnapshot,
} from './types';

function buildStatuses(
  input: EvaluateSpaceLifecycleInput,
): { statuses: MilestoneStatus[]; progress: SetupProgressSnapshot } {
  const profile = setupProfileForSpaceType(input.spaceType);
  const ctx = input.context;

  // First pass: evaluate non-derived milestones (OPS_READY needs requiredComplete).
  const baseStatuses: MilestoneStatus[] = profile.milestones.map(m => ({
    id: m.id,
    kind: m.kind,
    applies: true,
    done: evaluateMilestonePredicate(m.id, ctx, false),
    navigationTarget: m.navigationTarget,
  }));

  const required = baseStatuses.filter(s => s.kind === 'required');
  const requiredCompleted = required.filter(s => s.done).length;
  const requiredTotal = required.length;
  const isRequiredComplete = requiredTotal === 0 || requiredCompleted === requiredTotal;

  // Attach derived OPS_READY status for consumers (not in profile order for recommendations).
  const opsStatus: MilestoneStatus = {
    id: 'OPS_READY',
    kind: 'derived',
    applies: true,
    done: isRequiredComplete,
    navigationTarget: 'DASHBOARD',
  };

  const statuses = [...baseStatuses, opsStatus];
  const completedMilestoneIds = statuses.filter(s => s.applies && s.done).map(s => s.id);
  const pendingMilestoneIds = statuses
    .filter(s => s.applies && !s.done && s.kind !== 'derived')
    .map(s => s.id);

  const percentRemaining =
    requiredTotal === 0
      ? 0
      : Math.round(((requiredTotal - requiredCompleted) / requiredTotal) * 100);

  const progress: SetupProgressSnapshot = {
    requiredTotal,
    requiredCompleted,
    percentRemaining,
    isRequiredComplete,
    completedMilestoneIds,
    pendingMilestoneIds,
    statuses,
  };

  return { statuses, progress };
}

/**
 * Single entry point for the Space Lifecycle Engine.
 * Pure / deterministic given PredicateContext — no network I/O.
 */
export function evaluateSpaceLifecycle(
  input: EvaluateSpaceLifecycleInput,
): LifecycleEvaluationResult {
  const profile = setupProfileForSpaceType(input.spaceType);
  const { statuses, progress } = buildStatuses(input);
  const recommendation = recommendNextAction(profile, statuses, input.context);
  const lifecycle = deriveLifecycleState(progress, input.context);

  return {
    spaceType: input.spaceType,
    profile,
    lifecycle,
    progress,
    recommendation,
    statuses,
  };
}

export { needsPropertyStructure };
