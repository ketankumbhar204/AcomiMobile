import type { SpacePermissionsResponse, SpaceType } from '../api/types';
import type { SpaceSetupProgress, SetupStep } from '../utils/spaceSetupProgress';
import type {
  LifecycleEvaluationResult,
  PredicateContext,
} from './types';

/** Empty / zeroed predicate snapshot — useful in tests and before signals load. */
export function emptyPredicateContext(
  spaceType: SpaceType,
  permissions: SpacePermissionsResponse,
  overrides?: Partial<PredicateContext>,
): PredicateContext {
  return {
    spaceType,
    spaceExists: true,
    buildingCount: 0,
    floorCount: 0,
    unitCount: 0,
    roomCount: 0,
    bedCount: 0,
    memberCount: 0,
    hasMealLibrary: false,
    hasTodaysMenuPlanned: false,
    hasMenuShared: false,
    deliveryLocationCount: 0,
    pendingActionCount: 0,
    hasOperationalSignal: false,
    permissions,
    dismissedOptionalMilestoneIds: [],
    ...overrides,
  };
}

/**
 * Adapter: map lifecycle evaluation → legacy SpaceSetupProgress shape.
 * Used for gradual migration; Phase 1 dashboard still uses buildSpaceSetupProgress directly.
 * Does not change visible UI unless a caller opts in.
 */
export function lifecycleToLegacySetupProgress(
  result: LifecycleEvaluationResult,
  ctx: PredicateContext,
): SpaceSetupProgress {
  const byId = new Map(result.statuses.map(s => [s.id, s]));
  const property = byId.get('PROPERTY_READY');
  const residents = byId.get('RESIDENTS_READY');
  const meals = byId.get('MEALS_READY');

  const steps: SetupStep[] = [{ id: 'spaceCreated', done: true }];

  if (property?.applies) {
    const hasBuilding = ctx.buildingCount > 0;
    steps.push(
      { id: 'createBuilding', done: hasBuilding },
      {
        id: 'addFloors',
        done: hasBuilding && (ctx.floorCount > 0 || ctx.unitCount > 0 || property.done),
      },
      {
        id: 'addRooms',
        done: hasBuilding && (ctx.roomCount > 0 || property.done),
      },
      {
        id: 'addBeds',
        done: property.done,
      },
    );
  }

  steps.push({
    id: 'addMembers',
    done: residents?.done ?? ctx.memberCount > 0,
  });

  // Legacy checklist always included configureMeals; when profile omits meals, mark done.
  steps.push({
    id: 'configureMeals',
    done: meals ? meals.done : true,
  });

  const completedCount = steps.filter(s => s.done).length;
  const totalCount = steps.length;
  const nextStep = steps.find(s => !s.done) ?? null;
  const isComplete = result.progress.isRequiredComplete && nextStep == null;
  const percentRemaining =
    totalCount === 0
      ? 0
      : Math.round(((totalCount - completedCount) / totalCount) * 100);

  return {
    steps,
    completedCount,
    totalCount,
    percentRemaining,
    nextStepId: nextStep?.id ?? null,
    isComplete,
    needsPropertyStructure:
      Boolean(property?.applies) && ctx.buildingCount <= 0,
  };
}
