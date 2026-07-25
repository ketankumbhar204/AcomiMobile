import type { ProgressiveWorkflowPhase } from '../components/progressive';

export type ProgressivePhaseInput = {
  enabled: boolean;
  /** e.g. meal slots selected / rent entered — when false, show start (or hide continue). */
  prerequisiteMet: boolean;
  sectionReviewed: boolean;
};

/** Shared phase resolver for Progressive Guided Workflow screens. */
export function resolveProgressivePhase({
  enabled,
  prerequisiteMet,
  sectionReviewed,
}: ProgressivePhaseInput): ProgressiveWorkflowPhase {
  if (!enabled) {
    return 'ready';
  }
  if (!prerequisiteMet) {
    return 'start';
  }
  if (!sectionReviewed) {
    return 'continue';
  }
  return 'ready';
}
