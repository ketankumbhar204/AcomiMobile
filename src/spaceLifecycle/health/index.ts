export type {
  CalculateSpaceHealthInput,
  HealthCategoryBreakdown,
  HealthFactor,
  HealthFactorTone,
  HealthOperationalExtras,
  HealthSignals,
  SpaceHealthResult,
} from './types';
export {
  ATTENTION_PENDING_SATURATION,
  HEALTH_BANDS,
  HEALTH_CATEGORY_WEIGHTS,
  OPERATIONS_OCCUPANCY_FULL_AT,
  SETUP_INCOMPLETE_SCORE_CAP,
} from './healthWeights';
export type { HealthBandId, HealthCategoryId } from './healthWeights';
export { buildHealthSignals, isHealthScoreAvailable } from './healthSignals';
export { calculateSpaceHealth, resolveHealthBand } from './healthCalculator';
export { useSpaceHealth } from './useSpaceHealth';
export type { UseSpaceHealthArgs, UseSpaceHealthResult } from './useSpaceHealth';
