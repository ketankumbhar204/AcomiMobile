/**
 * Space Lifecycle Engine — Phase 1 foundation.
 * Pure domain evaluation for setup milestones, recommendations, and lifecycle state.
 * UI consumption begins in Phase 2+.
 */

export type {
  EvaluateSpaceLifecycleInput,
  LifecycleEvaluationResult,
  LifecycleState,
  MilestoneDefinition,
  MilestoneId,
  MilestoneKind,
  MilestoneStatus,
  PredicateContext,
  ProfileMilestone,
  RecommendedAction,
  SetupNavigationTarget,
  SetupProfile,
  SetupProgressSnapshot,
} from './types';

export { ALL_MILESTONE_IDS, getMilestoneDefinition, MILESTONE_CATALOG } from './milestones';
export { allSetupProfiles, hasProfileMilestone, LIFECYCLE_SPACE_TYPES, setupProfileForSpaceType } from './profiles';
export {
  evaluateMilestonePredicate,
  isDeliveryReady,
  isMealsReady,
  isPropertyReady,
  isResidentsReady,
  isSpaceCreated,
  needsPropertyStructure,
} from './predicates';
export { recommendNextAction } from './recommendation';
export { deriveLifecycleState } from './lifecycle';
export { evaluateSpaceLifecycle } from './evaluate';

export {
  emptyPredicateContext,
  lifecycleToLegacySetupProgress,
} from './compat';
export {
  dashboardVisibilityForLifecycle,
  shouldShowSetupChrome,
} from './dashboardVisibility';
export type { DashboardLifecycleVisibility } from './dashboardVisibility';
export { mapSetupNavigationTarget } from './navigation';
export type { SetupNavDestination } from './navigation';

export {
  ATTENTION_PENDING_SATURATION,
  HEALTH_BANDS,
  HEALTH_CATEGORY_WEIGHTS,
  OPERATIONS_OCCUPANCY_FULL_AT,
  SETUP_INCOMPLETE_SCORE_CAP,
  buildHealthSignals,
  calculateSpaceHealth,
  isHealthScoreAvailable,
  resolveHealthBand,
  useSpaceHealth,
} from './health';
export type {
  CalculateSpaceHealthInput,
  HealthBandId,
  HealthCategoryBreakdown,
  HealthCategoryId,
  HealthFactor,
  HealthFactorTone,
  HealthOperationalExtras,
  HealthSignals,
  SpaceHealthResult,
  UseSpaceHealthArgs,
  UseSpaceHealthResult,
} from './health';
