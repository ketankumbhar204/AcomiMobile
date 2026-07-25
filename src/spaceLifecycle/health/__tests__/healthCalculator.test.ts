import type { SpacePermissionsResponse, SpaceType } from '../../../api/types';
import { deriveSpacePermissions } from '../../../utils/spacePermissions';
import {
  calculateSpaceHealth,
  emptyPredicateContext,
  evaluateSpaceLifecycle,
  HEALTH_CATEGORY_WEIGHTS,
  isHealthScoreAvailable,
  resolveHealthBand,
  SETUP_INCOMPLETE_SCORE_CAP,
} from '../../index';
import { buildHealthSignals } from '../../health/healthSignals';
import type { PredicateContext } from '../../types';

function ownerPermissions(spaceType: SpaceType): SpacePermissionsResponse {
  return deriveSpacePermissions('OWNER', spaceType);
}

function ctx(
  spaceType: SpaceType,
  overrides: Partial<PredicateContext> = {},
): PredicateContext {
  return emptyPredicateContext(spaceType, ownerPermissions(spaceType), overrides);
}

describe('resolveHealthBand', () => {
  it('maps score bands to business labels', () => {
    expect(resolveHealthBand(100).band).toBe('excellent');
    expect(resolveHealthBand(90).band).toBe('excellent');
    expect(resolveHealthBand(89).band).toBe('healthy');
    expect(resolveHealthBand(75).band).toBe('healthy');
    expect(resolveHealthBand(74).band).toBe('needsImprovement');
    expect(resolveHealthBand(50).band).toBe('needsImprovement');
    expect(resolveHealthBand(49).band).toBe('atRisk');
    expect(resolveHealthBand(25).band).toBe('atRisk');
    expect(resolveHealthBand(24).band).toBe('critical');
    expect(resolveHealthBand(0).band).toBe('critical');
  });
});

describe('HEALTH_CATEGORY_WEIGHTS', () => {
  it('sums to 100%', () => {
    const sum =
      HEALTH_CATEGORY_WEIGHTS.setup +
      HEALTH_CATEGORY_WEIGHTS.operations +
      HEALTH_CATEGORY_WEIGHTS.attention;
    expect(sum).toBeCloseTo(1);
  });
});

describe('isHealthScoreAvailable', () => {
  it('hides vanity score on brand-new PG (space created only)', () => {
    const evaluation = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', { spaceExists: true }),
    });
    const signals = buildHealthSignals({
      evaluation,
      context: ctx('PG', { spaceExists: true }),
    });
    expect(evaluation.lifecycle).toBe('NEW');
    expect(signals.progress.requiredCompleted).toBeLessThanOrEqual(1);
    expect(isHealthScoreAvailable(signals)).toBe(false);
  });

  it('shows once property progress begins', () => {
    const context = ctx('PG', {
      spaceExists: true,
      buildingCount: 1,
      floorCount: 1,
      roomCount: 2,
      bedCount: 4,
    });
    const evaluation = evaluateSpaceLifecycle({ spaceType: 'PG', context });
    const signals = buildHealthSignals({ evaluation, context });
    expect(isHealthScoreAvailable(signals)).toBe(true);
  });

  it('shows for READY / ACTIVE / NEEDS_ATTENTION', () => {
    const readyCtx = ctx('RENTAL', {
      spaceExists: true,
      buildingCount: 1,
      floorCount: 1,
      unitCount: 1,
      roomCount: 1,
      bedCount: 1,
      memberCount: 1,
      hasOperationalSignal: true,
      pendingActionCount: 0,
    });
    const readyEval = evaluateSpaceLifecycle({
      spaceType: 'RENTAL',
      context: readyCtx,
    });
    expect(
      isHealthScoreAvailable(buildHealthSignals({ evaluation: readyEval, context: readyCtx })),
    ).toBe(true);

    const attentionCtx = { ...readyCtx, pendingActionCount: 3 };
    const attentionEval = evaluateSpaceLifecycle({
      spaceType: 'RENTAL',
      context: attentionCtx,
    });
    expect(attentionEval.lifecycle).toBe('NEEDS_ATTENTION');
    expect(
      isHealthScoreAvailable(
        buildHealthSignals({ evaluation: attentionEval, context: attentionCtx }),
      ),
    ).toBe(true);
  });
});

describe('calculateSpaceHealth', () => {
  it('returns unavailable (not 0%) for brand-new space', () => {
    const context = ctx('PG', { spaceExists: true });
    const evaluation = evaluateSpaceLifecycle({ spaceType: 'PG', context });
    const health = calculateSpaceHealth({ evaluation, context });
    expect(health.available).toBe(false);
    expect(health.topFactors).toEqual([]);
  });

  it('caps score while required setup is incomplete', () => {
    const context = ctx('PG', {
      spaceExists: true,
      buildingCount: 1,
      floorCount: 1,
      roomCount: 1,
      bedCount: 2,
    });
    const evaluation = evaluateSpaceLifecycle({ spaceType: 'PG', context });
    const health = calculateSpaceHealth({ evaluation, context });
    expect(health.available).toBe(true);
    expect(evaluation.progress.isRequiredComplete).toBe(false);
    expect(health.score).toBeLessThanOrEqual(SETUP_INCOMPLETE_SCORE_CAP);
  });

  it('weights three categories and exposes breakdown', () => {
    const context = ctx('MESS', {
      spaceExists: true,
      hasMealLibrary: true,
      hasTodaysMenuPlanned: true,
      hasMenuShared: true,
      memberCount: 5,
      hasOperationalSignal: true,
      pendingActionCount: 0,
    });
    const evaluation = evaluateSpaceLifecycle({ spaceType: 'MESS', context });
    const health = calculateSpaceHealth({ evaluation, context });
    expect(health.categories).toHaveLength(3);
    expect(health.categories.map(c => c.category).sort()).toEqual([
      'attention',
      'operations',
      'setup',
    ]);
    expect(health.bandLabelKey).toContain('dashboard.health.bands.');
  });

  it('deducts attention for pending actions with explanation', () => {
    const clearCtx = ctx('MESS', {
      spaceExists: true,
      hasMealLibrary: true,
      hasTodaysMenuPlanned: true,
      hasMenuShared: true,
      memberCount: 3,
      pendingActionCount: 0,
      hasOperationalSignal: true,
    });
    const pendingCtx = { ...clearCtx, pendingActionCount: 8 };
    const clear = calculateSpaceHealth({
      evaluation: evaluateSpaceLifecycle({ spaceType: 'MESS', context: clearCtx }),
      context: clearCtx,
    });
    const pending = calculateSpaceHealth({
      evaluation: evaluateSpaceLifecycle({
        spaceType: 'MESS',
        context: pendingCtx,
      }),
      context: pendingCtx,
    });
    expect(pending.available).toBe(true);
    expect(pending.score).toBeLessThan(clear.score);
    const attention = pending.categories.find(c => c.category === 'attention');
    expect(
      attention?.factors.some(f => f.id === 'attention.pending'),
    ).toBe(true);
    expect(
      attention?.suggestions.some(f => f.id === 'attention.resolvePending'),
    ).toBe(true);
  });

  it('surfaces lifecycle recommendation in setup suggestions', () => {
    const context = ctx('PG', {
      spaceExists: true,
      buildingCount: 1,
      floorCount: 1,
      roomCount: 1,
      bedCount: 2,
    });
    const evaluation = evaluateSpaceLifecycle({ spaceType: 'PG', context });
    expect(evaluation.recommendation).not.toBeNull();
    const health = calculateSpaceHealth({ evaluation, context });
    const setup = health.categories.find(c => c.category === 'setup');
    expect(
      setup?.suggestions.some(
        s => s.id === `setup.rec.${evaluation.recommendation!.milestoneId}`,
      ),
    ).toBe(true);
    expect(health.recommendation?.milestoneId).toBe(
      evaluation.recommendation?.milestoneId,
    );
  });

  it('limits top factors to three', () => {
    const context = ctx('PG', {
      spaceExists: true,
      buildingCount: 1,
      floorCount: 1,
      roomCount: 2,
      bedCount: 4,
      memberCount: 2,
      pendingActionCount: 2,
    });
    const evaluation = evaluateSpaceLifecycle({ spaceType: 'PG', context });
    const health = calculateSpaceHealth({
      evaluation,
      context,
      extras: { occupiedBeds: 1, vacantBeds: 3, underReviewPaymentCount: 1 },
    });
    expect(health.available).toBe(true);
    expect(health.topFactors.length).toBeLessThanOrEqual(3);
  });
});
