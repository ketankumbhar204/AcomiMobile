import type { SpaceType } from '../../api/types';
import { deriveSpacePermissions } from '../../utils/spacePermissions';
import {
  emptyPredicateContext,
  evaluateSpaceLifecycle,
  lifecycleToLegacySetupProgress,
} from '../index';

describe('lifecycleToLegacySetupProgress', () => {
  it('maps empty PG to createBuilding next step for legacy UI', () => {
    const spaceType: SpaceType = 'PG';
    const context = emptyPredicateContext(
      spaceType,
      deriveSpacePermissions('OWNER', spaceType),
    );
    const evaluation = evaluateSpaceLifecycle({ spaceType, context });
    const legacy = lifecycleToLegacySetupProgress(evaluation, context);

    expect(legacy.needsPropertyStructure).toBe(true);
    expect(legacy.nextStepId).toBe('createBuilding');
    expect(legacy.isComplete).toBe(false);
  });

  it('marks Rental complete without beds in legacy meals step', () => {
    const spaceType: SpaceType = 'RENTAL';
    const context = emptyPredicateContext(
      spaceType,
      deriveSpacePermissions('OWNER', spaceType),
      {
        buildingCount: 1,
        unitCount: 2,
        memberCount: 1,
      },
    );
    const evaluation = evaluateSpaceLifecycle({ spaceType, context });
    const legacy = lifecycleToLegacySetupProgress(evaluation, context);

    expect(evaluation.progress.isRequiredComplete).toBe(true);
    expect(legacy.steps.find(s => s.id === 'configureMeals')?.done).toBe(true);
  });
});
