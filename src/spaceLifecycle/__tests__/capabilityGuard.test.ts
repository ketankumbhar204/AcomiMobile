import type { SpacePermissionsResponse, SpaceType } from '../../api/types';
import { deriveSpacePermissions } from '../../utils/spacePermissions';
import { emptyPredicateContext, evaluateSpaceCapabilities, getBlockingCapability } from '../index';
import type { PredicateContext } from '../types';

function ownerPermissions(spaceType: SpaceType): SpacePermissionsResponse {
  return deriveSpacePermissions('OWNER', spaceType);
}

function ctx(
  spaceType: SpaceType,
  overrides: Partial<PredicateContext> = {},
): PredicateContext {
  return emptyPredicateContext(spaceType, ownerPermissions(spaceType), overrides);
}

describe('getBlockingCapability', () => {
  it('returns null when capabilities are missing (non-operator / loading)', () => {
    expect(getBlockingCapability(null, 'MEMBERS')).toBeNull();
    expect(getBlockingCapability(undefined, 'MEAL_OPS')).toBeNull();
  });

  it('blocks LOCKED members until property is ready', () => {
    const caps = evaluateSpaceCapabilities(
      ctx('PG', { buildingCount: 0, bedCount: 0 }),
    );
    const blocking = getBlockingCapability(caps, 'MEMBERS');
    expect(blocking?.mode).toBe('LOCKED');
    expect(blocking?.unlockTarget).toBe('QUICK_SETUP');
  });

  it('blocks HIDDEN meal ops for rental', () => {
    const caps = evaluateSpaceCapabilities(ctx('RENTAL', { buildingCount: 1, unitCount: 1 }));
    const blocking = getBlockingCapability(caps, 'MEAL_OPS');
    expect(blocking?.mode).toBe('HIDDEN');
  });

  it('allows AVAILABLE allocation after members exist', () => {
    const caps = evaluateSpaceCapabilities(
      ctx('PG', {
        buildingCount: 1,
        bedCount: 4,
        memberCount: 1,
        allocatedMemberCount: 0,
      }),
    );
    expect(caps.byId.ALLOCATION.mode).toBe('AVAILABLE');
    expect(getBlockingCapability(caps, 'ALLOCATION')).toBeNull();
  });

  it('does not block SOFT payments', () => {
    const caps = evaluateSpaceCapabilities(
      ctx('PG', { buildingCount: 1, bedCount: 4, memberCount: 0 }),
    );
    expect(caps.byId.PAYMENTS.mode).toBe('SOFT');
    expect(getBlockingCapability(caps, 'PAYMENTS')).toBeNull();
  });
});
