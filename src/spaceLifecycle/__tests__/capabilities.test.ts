import type { SpacePermissionsResponse, SpaceType } from '../../api/types';
import { deriveSpacePermissions } from '../../utils/spacePermissions';
import {
  emptyPredicateContext,
  evaluateSpaceCapabilities,
  isCapabilityLocked,
  isCapabilityOpen,
} from '../index';
import type { PredicateContext } from '../types';

function ownerPermissions(spaceType: SpaceType): SpacePermissionsResponse {
  return deriveSpacePermissions('OWNER', spaceType);
}

function tenantPermissions(spaceType: SpaceType): SpacePermissionsResponse {
  return deriveSpacePermissions('TENANT', spaceType);
}

function ctx(
  spaceType: SpaceType,
  overrides: Partial<PredicateContext> = {},
  permissions?: SpacePermissionsResponse,
): PredicateContext {
  return emptyPredicateContext(
    spaceType,
    permissions ?? ownerPermissions(spaceType),
    overrides,
  );
}

describe('evaluateSpaceCapabilities', () => {
  it('locks lodging Members until property is ready (D1)', () => {
    const result = evaluateSpaceCapabilities(
      ctx('PG', { buildingCount: 0, bedCount: 0 }),
    );
    expect(result.byId.MEMBERS.mode).toBe('LOCKED');
    expect(result.byId.MEMBERS.unlockTarget).toBe('QUICK_SETUP');
  });

  it('unlocks lodging Members after property ready', () => {
    const result = evaluateSpaceCapabilities(
      ctx('PG', { buildingCount: 1, bedCount: 4 }),
    );
    expect(result.byId.MEMBERS.mode).toBe('AVAILABLE');
  });

  it('allows meal config after property without members (D2)', () => {
    const result = evaluateSpaceCapabilities(
      ctx('PG', { buildingCount: 1, bedCount: 4, memberCount: 0 }),
    );
    expect(result.byId.MEAL_CONFIG.mode).toBe('AVAILABLE');
    expect(result.byId.MEAL_OPS.mode).toBe('LOCKED');
  });

  it('locks meal ops until meal library and allocation for PG', () => {
    const withoutAlloc = evaluateSpaceCapabilities(
      ctx('PG', {
        buildingCount: 1,
        bedCount: 4,
        memberCount: 1,
        hasMealLibrary: true,
        allocatedMemberCount: 0,
      }),
    );
    expect(withoutAlloc.byId.MEAL_OPS.mode).toBe('LOCKED');

    const withAlloc = evaluateSpaceCapabilities(
      ctx('PG', {
        buildingCount: 1,
        bedCount: 4,
        memberCount: 1,
        hasMealLibrary: true,
        allocatedMemberCount: 1,
      }),
    );
    expect(withAlloc.byId.MEAL_OPS.mode).toBe('AVAILABLE');
  });

  it('allows meal ops on Mess when seeded sample library exists', () => {
    const result = evaluateSpaceCapabilities(
      ctx('MESS', {
        hasMealLibrary: true,
        hasCuratedMealLibrary: false,
        memberCount: 0,
      }),
    );
    expect(result.byId.MEAL_OPS.mode).toBe('AVAILABLE');
    expect(result.byId.MEAL_CONFIG.mode).toBe('AVAILABLE');
  });

  it('locks meal ops when meal library is empty', () => {
    const result = evaluateSpaceCapabilities(
      ctx('MESS', {
        hasMealLibrary: false,
        hasCuratedMealLibrary: false,
        memberCount: 0,
      }),
    );
    expect(result.byId.MEAL_OPS.mode).toBe('LOCKED');
  });

  it('hides accommodation and allocation for Mess', () => {
    const result = evaluateSpaceCapabilities(ctx('MESS'));
    expect(result.byId.ACCOMMODATION.mode).toBe('HIDDEN');
    expect(result.byId.ALLOCATION.mode).toBe('HIDDEN');
  });

  it('hides meal capabilities for Rental', () => {
    const result = evaluateSpaceCapabilities(
      ctx('RENTAL', { buildingCount: 1, unitCount: 2 }),
    );
    expect(result.byId.MEAL_CONFIG.mode).toBe('HIDDEN');
    expect(result.byId.MEAL_OPS.mode).toBe('HIDDEN');
  });

  it('softens payments until billable activity (D4)', () => {
    const soft = evaluateSpaceCapabilities(
      ctx('PG', {
        buildingCount: 1,
        bedCount: 2,
        memberCount: 1,
        hasBillableActivity: false,
      }),
    );
    expect(soft.byId.PAYMENTS.mode).toBe('SOFT');

    const full = evaluateSpaceCapabilities(
      ctx('PG', {
        buildingCount: 1,
        bedCount: 2,
        memberCount: 1,
        allocatedMemberCount: 1,
        hasBillableActivity: true,
      }),
    );
    expect(full.byId.PAYMENTS.mode).toBe('AVAILABLE');
  });

  it('does not lock tenant meal ops for owner setup gaps', () => {
    const result = evaluateSpaceCapabilities(
      ctx(
        'PG',
        { buildingCount: 0, bedCount: 0, hasCuratedMealLibrary: false },
        tenantPermissions('PG'),
      ),
    );
    expect(result.progressiveOperator).toBe(false);
    expect(isCapabilityLocked(result, 'MEMBERS')).toBe(false);
    expect(result.byId.MEMBERS.mode).toBe('HIDDEN');
    expect(isCapabilityOpen(result, 'MEAL_OPS')).toBe(true);
  });

  it('locks allocation until members exist (D3)', () => {
    const result = evaluateSpaceCapabilities(
      ctx('HOSTEL', {
        buildingCount: 1,
        bedCount: 6,
        memberCount: 0,
      }),
    );
    expect(result.byId.ALLOCATION.mode).toBe('LOCKED');
    expect(result.byId.ALLOCATION.unlockTarget).toBe('ADD_MEMBER');
  });

  it('keeps inventory available during setup', () => {
    const result = evaluateSpaceCapabilities(ctx('MESS'));
    expect(result.byId.INVENTORY.mode).toBe('AVAILABLE');
  });
});
