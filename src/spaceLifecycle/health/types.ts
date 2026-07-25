import type {
  LifecycleEvaluationResult,
  LifecycleState,
  PredicateContext,
  RecommendedAction,
  SetupProgressSnapshot,
} from '../types';
import type { HealthBandId, HealthCategoryId } from './healthWeights';

export type HealthFactorTone = 'positive' | 'warning' | 'negative';

export type HealthFactor = {
  id: string;
  category: HealthCategoryId;
  tone: HealthFactorTone;
  /** i18n key */
  labelKey: string;
  labelParams?: Record<string, string | number>;
};

export type HealthCategoryBreakdown = {
  category: HealthCategoryId;
  /** 0–100 category score before weighting */
  score: number;
  weight: number;
  factors: HealthFactor[];
  /** Improvement tips derived from gaps + recommendation engine */
  suggestions: HealthFactor[];
};

export type SpaceHealthResult = {
  /** False → show empty state (no vanity 0%). */
  available: boolean;
  score: number;
  band: HealthBandId;
  bandLabelKey: string;
  summaryKey: string;
  topFactors: HealthFactor[];
  categories: HealthCategoryBreakdown[];
  /** Existing lifecycle recommendation — never invent parallel advice. */
  recommendation: RecommendedAction | null;
  lifecycle: LifecycleState;
};

/** Optional live ops signals already on the dashboard (no extra queries). */
export type HealthOperationalExtras = {
  occupiedBeds?: number | null;
  vacantBeds?: number | null;
  /** Payments under review from financial snapshot when present. */
  underReviewPaymentCount?: number | null;
};

export type CalculateSpaceHealthInput = {
  evaluation: LifecycleEvaluationResult;
  context: PredicateContext;
  extras?: HealthOperationalExtras;
};

export type HealthSignals = {
  lifecycle: LifecycleState;
  progress: SetupProgressSnapshot;
  recommendation: RecommendedAction | null;
  pendingActionCount: number;
  memberCount: number;
  hasMealLibrary: boolean;
  hasTodaysMenuPlanned: boolean;
  hasMenuShared: boolean;
  hasOperationalSignal: boolean;
  isMess: boolean;
  occupiedBeds: number;
  vacantBeds: number;
  bedTotal: number;
  underReviewPaymentCount: number;
  buildingCount: number;
};
