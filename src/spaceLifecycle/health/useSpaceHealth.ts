import { useMemo } from 'react';
import type { LifecycleEvaluationResult, PredicateContext } from '../types';
import { calculateSpaceHealth } from './healthCalculator';
import type {
  HealthOperationalExtras,
  SpaceHealthResult,
} from './types';

export type UseSpaceHealthArgs = {
  evaluation: LifecycleEvaluationResult | null;
  context: PredicateContext | null;
  extras?: HealthOperationalExtras;
  enabled?: boolean;
};

export type UseSpaceHealthResult = {
  health: SpaceHealthResult | null;
};

/**
 * Memoized Health Score from existing lifecycle evaluation + signals.
 * Does not fetch — callers pass dashboard-already-loaded extras.
 */
export function useSpaceHealth({
  evaluation,
  context,
  extras,
  enabled = true,
}: UseSpaceHealthArgs): UseSpaceHealthResult {
  const health = useMemo(() => {
    if (!enabled || !evaluation || !context) {
      return null;
    }
    return calculateSpaceHealth({ evaluation, context, extras });
  }, [context, enabled, evaluation, extras]);

  return { health };
}
