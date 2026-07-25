/**
 * Configurable Health Score weights and thresholds.
 * Keep all numeric policy here — never hardcode inside UI.
 */

export const HEALTH_CATEGORY_WEIGHTS = {
  setup: 0.5,
  operations: 0.3,
  attention: 0.2,
} as const;

/** Pending actions at/above this count drive Attention Health to 0. */
export const ATTENTION_PENDING_SATURATION = 10;

/**
 * When required setup is incomplete, overall score cannot exceed this
 * (prevents “Healthy” while property/mess setup is unfinished).
 */
export const SETUP_INCOMPLETE_SCORE_CAP = 69;

/** Occupancy fill rate (0–1) that scores full operational occupancy credit. */
export const OPERATIONS_OCCUPANCY_FULL_AT = 0.6;

export type HealthCategoryId = keyof typeof HEALTH_CATEGORY_WEIGHTS;

export const HEALTH_BANDS = [
  { id: 'excellent', min: 90, max: 100, labelKey: 'dashboard.health.bands.excellent' },
  { id: 'healthy', min: 75, max: 89, labelKey: 'dashboard.health.bands.healthy' },
  {
    id: 'needsImprovement',
    min: 50,
    max: 74,
    labelKey: 'dashboard.health.bands.needsImprovement',
  },
  { id: 'atRisk', min: 25, max: 49, labelKey: 'dashboard.health.bands.atRisk' },
  { id: 'critical', min: 0, max: 24, labelKey: 'dashboard.health.bands.critical' },
] as const;

export type HealthBandId = (typeof HEALTH_BANDS)[number]['id'];
