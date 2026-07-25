import {
  ATTENTION_PENDING_SATURATION,
  HEALTH_BANDS,
  HEALTH_CATEGORY_WEIGHTS,
  OPERATIONS_OCCUPANCY_FULL_AT,
  SETUP_INCOMPLETE_SCORE_CAP,
  type HealthBandId,
} from './healthWeights';
import { buildHealthSignals, isHealthScoreAvailable } from './healthSignals';
import type {
  CalculateSpaceHealthInput,
  HealthCategoryBreakdown,
  HealthFactor,
  HealthSignals,
  SpaceHealthResult,
} from './types';

function clampScore(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function resolveHealthBand(score: number): {
  band: HealthBandId;
  labelKey: string;
} {
  const clamped = clampScore(score);
  for (const band of HEALTH_BANDS) {
    if (clamped >= band.min && clamped <= band.max) {
      return { band: band.id, labelKey: band.labelKey };
    }
  }
  return {
    band: 'critical',
    labelKey: 'dashboard.health.bands.critical',
  };
}

function scoreSetup(signals: HealthSignals): HealthCategoryBreakdown {
  const { progress } = signals;
  const total = Math.max(1, progress.requiredTotal);
  const completed = Math.min(progress.requiredCompleted, total);
  const score = clampScore((completed / total) * 100);

  const factors: HealthFactor[] = [];
  const suggestions: HealthFactor[] = [];

  if (progress.isRequiredComplete) {
    factors.push({
      id: 'setup.complete',
      category: 'setup',
      tone: 'positive',
      labelKey: 'dashboard.health.factors.setupComplete',
    });
  } else {
    factors.push({
      id: 'setup.progress',
      category: 'setup',
      tone: score >= 50 ? 'warning' : 'negative',
      labelKey: 'dashboard.health.factors.setupProgress',
      labelParams: {
        completed,
        total,
        percent: score,
      },
    });
    suggestions.push({
      id: 'setup.completeRemaining',
      category: 'setup',
      tone: 'warning',
      labelKey: 'dashboard.health.suggestions.completeSetup',
      labelParams: {
        count: progress.pendingMilestoneIds.length,
      },
    });
  }

  return {
    category: 'setup',
    score,
    weight: HEALTH_CATEGORY_WEIGHTS.setup,
    factors,
    suggestions,
  };
}

function scoreOperations(signals: HealthSignals): HealthCategoryBreakdown {
  const factors: HealthFactor[] = [];
  const suggestions: HealthFactor[] = [];
  let score = 40;

  if (signals.isMess) {
    if (signals.hasMealLibrary) {
      score += 20;
      factors.push({
        id: 'ops.menuLibrary',
        category: 'operations',
        tone: 'positive',
        labelKey: 'dashboard.health.factors.menuLibrary',
      });
    } else {
      suggestions.push({
        id: 'ops.needMenuLibrary',
        category: 'operations',
        tone: 'warning',
        labelKey: 'dashboard.health.suggestions.completeMenuSetup',
      });
    }
    if (signals.hasTodaysMenuPlanned) {
      score += 15;
      factors.push({
        id: 'ops.todaysMenu',
        category: 'operations',
        tone: 'positive',
        labelKey: 'dashboard.health.factors.todaysMenu',
      });
    }
    if (signals.hasMenuShared) {
      score += 15;
      factors.push({
        id: 'ops.menuShared',
        category: 'operations',
        tone: 'positive',
        labelKey: 'dashboard.health.factors.menuShared',
      });
    }
    if (signals.memberCount > 0) {
      score += 10;
      factors.push({
        id: 'ops.customers',
        category: 'operations',
        tone: 'positive',
        labelKey: 'dashboard.health.factors.customersActive',
        labelParams: { count: signals.memberCount },
      });
    } else {
      suggestions.push({
        id: 'ops.needCustomers',
        category: 'operations',
        tone: 'warning',
        labelKey: 'dashboard.health.suggestions.addResidents',
      });
    }
  } else {
    if (signals.buildingCount > 0) {
      score += 15;
      factors.push({
        id: 'ops.property',
        category: 'operations',
        tone: 'positive',
        labelKey: 'dashboard.health.factors.propertyReady',
      });
    } else {
      suggestions.push({
        id: 'ops.needProperty',
        category: 'operations',
        tone: 'warning',
        labelKey: 'dashboard.health.suggestions.completeProperty',
      });
    }
    if (signals.memberCount > 0) {
      score += 20;
      factors.push({
        id: 'ops.residents',
        category: 'operations',
        tone: 'positive',
        labelKey: 'dashboard.health.factors.residentsActive',
        labelParams: { count: signals.memberCount },
      });
    } else if (signals.progress.isRequiredComplete) {
      suggestions.push({
        id: 'ops.needResidents',
        category: 'operations',
        tone: 'warning',
        labelKey: 'dashboard.health.suggestions.addResidents',
      });
    }
    if (signals.bedTotal > 0) {
      const fill = signals.occupiedBeds / signals.bedTotal;
      const occupancyCredit = Math.min(
        25,
        (fill / OPERATIONS_OCCUPANCY_FULL_AT) * 25,
      );
      score += occupancyCredit;
      if (fill > 0) {
        factors.push({
          id: 'ops.occupancy',
          category: 'operations',
          tone: fill >= 0.3 ? 'positive' : 'warning',
          labelKey: 'dashboard.health.factors.occupancy',
          labelParams: {
            occupied: signals.occupiedBeds,
            total: signals.bedTotal,
          },
        });
      }
    }
  }

  if (signals.hasOperationalSignal) {
    score += 5;
  }

  if (
    signals.lifecycle === 'READY' ||
    signals.lifecycle === 'ACTIVE' ||
    signals.lifecycle === 'NEEDS_ATTENTION'
  ) {
    score = Math.max(score, 55);
  }

  return {
    category: 'operations',
    score: clampScore(score),
    weight: HEALTH_CATEGORY_WEIGHTS.operations,
    factors,
    suggestions,
  };
}

function scoreAttention(signals: HealthSignals): HealthCategoryBreakdown {
  const factors: HealthFactor[] = [];
  const suggestions: HealthFactor[] = [];
  const pending = signals.pendingActionCount;
  const ratio = Math.min(1, pending / ATTENTION_PENDING_SATURATION);
  let score = clampScore((1 - ratio) * 100);

  if (pending === 0) {
    factors.push({
      id: 'attention.clear',
      category: 'attention',
      tone: 'positive',
      labelKey: 'dashboard.health.factors.attentionClear',
    });
  } else {
    factors.push({
      id: 'attention.pending',
      category: 'attention',
      tone: pending >= 5 ? 'negative' : 'warning',
      labelKey: 'dashboard.health.factors.pendingActions',
      labelParams: { count: pending },
    });
    suggestions.push({
      id: 'attention.resolvePending',
      category: 'attention',
      tone: 'warning',
      labelKey: 'dashboard.health.suggestions.resolvePending',
      labelParams: { count: pending },
    });
  }

  if (signals.underReviewPaymentCount > 0) {
    score = clampScore(score - Math.min(20, signals.underReviewPaymentCount * 5));
    factors.push({
      id: 'attention.payments',
      category: 'attention',
      tone: 'warning',
      labelKey: 'dashboard.health.factors.pendingPayments',
      labelParams: { count: signals.underReviewPaymentCount },
    });
    suggestions.push({
      id: 'attention.reviewPayments',
      category: 'attention',
      tone: 'warning',
      labelKey: 'dashboard.health.suggestions.resolvePayments',
      labelParams: { count: signals.underReviewPaymentCount },
    });
  }

  if (signals.lifecycle === 'NEEDS_ATTENTION' && pending > 0) {
    score = Math.min(score, 60);
  }

  return {
    category: 'attention',
    score: clampScore(score),
    weight: HEALTH_CATEGORY_WEIGHTS.attention,
    factors,
    suggestions,
  };
}

function pickTopFactors(
  categories: HealthCategoryBreakdown[],
): HealthFactor[] {
  const positives = categories.flatMap(c =>
    c.factors.filter(f => f.tone === 'positive'),
  );
  const concerns = categories.flatMap(c =>
    c.factors.filter(f => f.tone !== 'positive'),
  );
  const ordered = [...concerns, ...positives];
  const seen = new Set<string>();
  const top: HealthFactor[] = [];
  for (const factor of ordered) {
    if (seen.has(factor.id)) {
      continue;
    }
    seen.add(factor.id);
    top.push(factor);
    if (top.length >= 3) {
      break;
    }
  }
  return top;
}

function attachRecommendationSuggestions(
  categories: HealthCategoryBreakdown[],
  signals: HealthSignals,
): void {
  const rec = signals.recommendation;
  if (!rec) {
    return;
  }
  const setup = categories.find(c => c.category === 'setup');
  if (!setup || signals.progress.isRequiredComplete) {
    return;
  }
  const already = setup.suggestions.some(
    s =>
      s.id === `setup.rec.${rec.milestoneId}` ||
      s.id === `setup.pending.${rec.milestoneId}`,
  );
  if (already) {
    return;
  }
  setup.suggestions.unshift({
    id: `setup.rec.${rec.milestoneId}`,
    category: 'setup',
    tone: 'warning',
    // Reuse recommendation engine copy stems (titleKey already i18n).
    labelKey: rec.titleKey,
  });
}

function summaryKeyFor(
  available: boolean,
  band: HealthBandId,
  signals: HealthSignals,
): string {
  if (!available) {
    return 'dashboard.health.emptyBody';
  }
  if (signals.lifecycle === 'NEEDS_ATTENTION') {
    return 'dashboard.health.summary.needsAttention';
  }
  if (!signals.progress.isRequiredComplete) {
    return 'dashboard.health.summary.setup';
  }
  switch (band) {
    case 'excellent':
    case 'healthy':
      return 'dashboard.health.summary.healthy';
    case 'needsImprovement':
      return 'dashboard.health.summary.improve';
    case 'atRisk':
    case 'critical':
      return 'dashboard.health.summary.risk';
    default:
      return 'dashboard.health.summary.improve';
  }
}

/**
 * Pure Health Score calculator — no I/O, no React.
 * Reuses lifecycle evaluation + predicate context; does not re-run predicates.
 */
export function calculateSpaceHealth(
  input: CalculateSpaceHealthInput,
): SpaceHealthResult {
  const signals = buildHealthSignals(input);
  const available = isHealthScoreAvailable(signals);

  const categories: HealthCategoryBreakdown[] = [
    scoreSetup(signals),
    scoreOperations(signals),
    scoreAttention(signals),
  ];
  attachRecommendationSuggestions(categories, signals);

  let score = clampScore(
    categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0),
  );

  if (!signals.progress.isRequiredComplete) {
    score = Math.min(score, SETUP_INCOMPLETE_SCORE_CAP);
  }

  const { band, labelKey } = resolveHealthBand(score);

  return {
    available,
    score,
    band,
    bandLabelKey: labelKey,
    summaryKey: summaryKeyFor(available, band, signals),
    topFactors: available ? pickTopFactors(categories) : [],
    categories,
    recommendation: signals.recommendation,
    lifecycle: signals.lifecycle,
  };
}
