import { useMemo } from 'react';
import type { SpaceType } from '../api/types';
import {
  evaluateSpaceCapabilities,
  evaluateSpaceLifecycle,
  type CapabilityAccess,
  type CapabilityId,
  type LifecycleEvaluationResult,
  type LifecycleState,
  type MilestoneId,
  type MilestoneStatus,
  type PredicateContext,
  type RecommendedAction,
  type SetupProgressSnapshot,
  type SpaceCapabilitiesResult,
} from '../spaceLifecycle';

export type UseSpaceLifecycleResult = {
  /** Full evaluation result; null when disabled or spaceType missing. */
  evaluation: LifecycleEvaluationResult | null;
  lifecycle: LifecycleState | null;
  progress: SetupProgressSnapshot | null;
  completedMilestones: MilestoneStatus[];
  pendingMilestones: MilestoneStatus[];
  nextRecommendedAction: RecommendedAction | null;
  completedMilestoneIds: MilestoneId[];
  pendingMilestoneIds: MilestoneId[];
  /** Progressive Guided Access capabilities (null when no context). */
  capabilities: SpaceCapabilitiesResult | null;
  getCapability: (id: CapabilityId) => CapabilityAccess | null;
};

type UseSpaceLifecycleArgs = {
  spaceType: SpaceType | null | undefined;
  /** Already-fetched signals — hook performs no network I/O. */
  context: PredicateContext | null;
  enabled?: boolean;
};

/**
 * Evaluates lifecycle + capabilities from a pure PredicateContext (no network I/O).
 */
export function useSpaceLifecycle({
  spaceType,
  context,
  enabled = true,
}: UseSpaceLifecycleArgs): UseSpaceLifecycleResult {
  const evaluation = useMemo(() => {
    if (!enabled || !spaceType || !context) {
      return null;
    }
    return evaluateSpaceLifecycle({
      spaceType,
      context: { ...context, spaceType },
    });
  }, [context, enabled, spaceType]);

  const capabilities = useMemo(() => {
    if (!enabled || !spaceType || !context) {
      return null;
    }
    return evaluateSpaceCapabilities({ ...context, spaceType });
  }, [context, enabled, spaceType]);

  return useMemo(() => {
    if (!evaluation) {
      return {
        evaluation: null,
        lifecycle: null,
        progress: null,
        completedMilestones: [],
        pendingMilestones: [],
        nextRecommendedAction: null,
        completedMilestoneIds: [],
        pendingMilestoneIds: [],
        capabilities: null,
        getCapability: () => null,
      };
    }

    const completedMilestones = evaluation.statuses.filter(
      s => s.applies && s.done,
    );
    const pendingMilestones = evaluation.statuses.filter(
      s => s.applies && !s.done && s.kind !== 'derived',
    );

    return {
      evaluation,
      lifecycle: evaluation.lifecycle,
      progress: evaluation.progress,
      completedMilestones,
      pendingMilestones,
      nextRecommendedAction: evaluation.recommendation,
      completedMilestoneIds: evaluation.progress.completedMilestoneIds,
      pendingMilestoneIds: evaluation.progress.pendingMilestoneIds,
      capabilities,
      getCapability: (id: CapabilityId) => capabilities?.byId[id] ?? null,
    };
  }, [capabilities, evaluation]);
}
