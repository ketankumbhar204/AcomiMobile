import type { SpacePermissionsResponse, SpaceType } from '../../api/types';
import { deriveSpacePermissions } from '../../utils/spacePermissions';
import {
  allSetupProfiles,
  emptyPredicateContext,
  evaluateSpaceLifecycle,
  hasProfileMilestone,
  isPropertyReady,
  LIFECYCLE_SPACE_TYPES,
  setupProfileForSpaceType,
} from '../index';
import type { PredicateContext } from '../types';

function ownerPermissions(spaceType: SpaceType): SpacePermissionsResponse {
  return deriveSpacePermissions('OWNER', spaceType);
}

function staffPermissions(spaceType: SpaceType): SpacePermissionsResponse {
  return deriveSpacePermissions('STAFF', spaceType);
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

describe('setupProfileForSpaceType', () => {
  it('covers every SpaceType in LIFECYCLE_SPACE_TYPES', () => {
    const profiles = allSetupProfiles();
    expect(profiles.map(p => p.spaceType).sort()).toEqual(
      [...LIFECYCLE_SPACE_TYPES].sort(),
    );
  });

  it('PG/HOSTEL/CO_LIVING include property + optional meals', () => {
    for (const type of ['PG', 'HOSTEL', 'CO_LIVING'] as SpaceType[]) {
      const profile = setupProfileForSpaceType(type);
      expect(hasProfileMilestone(profile, 'PROPERTY_READY')).toBe(true);
      expect(hasProfileMilestone(profile, 'RESIDENTS_READY')).toBe(true);
      expect(hasProfileMilestone(profile, 'MEALS_READY')).toBe(true);
      expect(hasProfileMilestone(profile, 'DELIVERY_READY')).toBe(false);
      expect(profile.milestones.find(m => m.id === 'MEALS_READY')?.kind).toBe(
        'optional',
      );
    }
  });

  it('RENTAL includes property and residents but omits meals and delivery', () => {
    const profile = setupProfileForSpaceType('RENTAL');
    expect(hasProfileMilestone(profile, 'PROPERTY_READY')).toBe(true);
    expect(hasProfileMilestone(profile, 'RESIDENTS_READY')).toBe(true);
    expect(hasProfileMilestone(profile, 'MEALS_READY')).toBe(false);
    expect(hasProfileMilestone(profile, 'DELIVERY_READY')).toBe(false);
  });

  it('MESS follows business workflow: library → customers (optional) → menu → share (+ delivery tip)', () => {
    const profile = setupProfileForSpaceType('MESS');
    expect(hasProfileMilestone(profile, 'PROPERTY_READY')).toBe(false);
    expect(hasProfileMilestone(profile, 'MEALS_READY')).toBe(true);
    expect(hasProfileMilestone(profile, 'TODAYS_MENU_READY')).toBe(true);
    expect(hasProfileMilestone(profile, 'RESIDENTS_READY')).toBe(true);
    expect(hasProfileMilestone(profile, 'MENU_SHARED')).toBe(true);
    expect(hasProfileMilestone(profile, 'DELIVERY_READY')).toBe(true);
    expect(profile.milestones.find(m => m.id === 'MEALS_READY')?.kind).toBe(
      'required',
    );
    expect(profile.milestones.find(m => m.id === 'RESIDENTS_READY')?.kind).toBe(
      'optional',
    );
    expect(profile.milestones.find(m => m.id === 'TODAYS_MENU_READY')?.kind).toBe(
      'required',
    );
    expect(profile.milestones.find(m => m.id === 'MENU_SHARED')?.kind).toBe(
      'required',
    );
    expect(profile.milestones.find(m => m.id === 'DELIVERY_READY')?.kind).toBe(
      'recommended',
    );
    const ids = profile.milestones.map(m => m.id);
    expect(ids.indexOf('MEALS_READY')).toBeLessThan(ids.indexOf('RESIDENTS_READY'));
    expect(ids.indexOf('RESIDENTS_READY')).toBeLessThan(ids.indexOf('TODAYS_MENU_READY'));
    expect(ids.indexOf('TODAYS_MENU_READY')).toBeLessThan(ids.indexOf('MENU_SHARED'));
  });
});

describe('isPropertyReady', () => {
  it('requires beds for PG when buildings exist', () => {
    expect(
      isPropertyReady(ctx('PG', { buildingCount: 1, bedCount: 0, unitCount: 2 })),
    ).toBe(false);
    expect(
      isPropertyReady(ctx('PG', { buildingCount: 1, bedCount: 4 })),
    ).toBe(true);
  });

  it('requires units (not beds) for RENTAL', () => {
    expect(
      isPropertyReady(
        ctx('RENTAL', { buildingCount: 1, unitCount: 0, bedCount: 0 }),
      ),
    ).toBe(false);
    expect(
      isPropertyReady(
        ctx('RENTAL', { buildingCount: 1, unitCount: 3, bedCount: 0 }),
      ),
    ).toBe(true);
  });

  it('is vacuously true for MESS', () => {
    expect(isPropertyReady(ctx('MESS'))).toBe(true);
  });
});

describe('evaluateSpaceLifecycle', () => {
  it('PG empty → NEW + recommend PROPERTY_READY', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG'),
    });
    expect(result.lifecycle).toBe('NEW');
    expect(result.recommendation?.milestoneId).toBe('PROPERTY_READY');
    expect(result.recommendation?.kind).toBe('required');
    expect(result.progress.isRequiredComplete).toBe(false);
  });

  it('PG property ready, no members → RESIDENTS_READY', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', {
        buildingCount: 1,
        floorCount: 2,
        roomCount: 4,
        bedCount: 8,
        memberCount: 0,
      }),
    });
    expect(result.lifecycle).toBe('SETUP_IN_PROGRESS');
    expect(result.recommendation?.milestoneId).toBe('RESIDENTS_READY');
  });

  it('PG required complete without meals → READY + optional MEALS tip', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', {
        buildingCount: 1,
        bedCount: 4,
        memberCount: 2,
        hasMealLibrary: false,
      }),
    });
    expect(result.progress.isRequiredComplete).toBe(true);
    expect(result.lifecycle).toBe('READY');
    expect(result.recommendation?.milestoneId).toBe('MEALS_READY');
    expect(result.recommendation?.kind).toBe('optional');
  });

  it('PG required complete with meals → no recommendation + READY', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', {
        buildingCount: 1,
        bedCount: 4,
        memberCount: 2,
        hasMealLibrary: true,
      }),
    });
    expect(result.recommendation).toBeNull();
    expect(result.lifecycle).toBe('READY');
  });

  it('PG READY + pending actions → NEEDS_ATTENTION', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', {
        buildingCount: 1,
        bedCount: 4,
        memberCount: 2,
        hasMealLibrary: true,
        pendingActionCount: 3,
      }),
    });
    expect(result.lifecycle).toBe('NEEDS_ATTENTION');
  });

  it('PG READY + operational signal → ACTIVE', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', {
        buildingCount: 1,
        bedCount: 4,
        memberCount: 2,
        hasMealLibrary: true,
        hasOperationalSignal: true,
      }),
    });
    expect(result.lifecycle).toBe('ACTIVE');
  });

  it('HOSTEL mirrors PG property recommendation when empty', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'HOSTEL',
      context: ctx('HOSTEL'),
    });
    expect(result.recommendation?.milestoneId).toBe('PROPERTY_READY');
  });

  it('CO_LIVING uses beds for property readiness', () => {
    const incomplete = evaluateSpaceLifecycle({
      spaceType: 'CO_LIVING',
      context: ctx('CO_LIVING', {
        buildingCount: 1,
        unitCount: 2,
        bedCount: 0,
      }),
    });
    expect(incomplete.recommendation?.milestoneId).toBe('PROPERTY_READY');

    const ready = evaluateSpaceLifecycle({
      spaceType: 'CO_LIVING',
      context: ctx('CO_LIVING', {
        buildingCount: 1,
        unitCount: 2,
        roomCount: 4,
        bedCount: 6,
        memberCount: 1,
        hasMealLibrary: true,
      }),
    });
    expect(ready.progress.isRequiredComplete).toBe(true);
    expect(ready.recommendation).toBeNull();
  });

  it('RENTAL completes without beds or meals', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'RENTAL',
      context: ctx('RENTAL', {
        buildingCount: 1,
        unitCount: 2,
        bedCount: 0,
        memberCount: 1,
        hasMealLibrary: false,
      }),
    });
    expect(result.progress.isRequiredComplete).toBe(true);
    expect(result.recommendation).toBeNull();
    expect(hasProfileMilestone(result.profile, 'MEALS_READY')).toBe(false);
  });

  it('MESS empty → recommend MEALS_READY first', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS'),
    });
    expect(result.lifecycle).toBe('NEW');
    expect(result.recommendation?.milestoneId).toBe('MEALS_READY');
    expect(hasProfileMilestone(result.profile, 'PROPERTY_READY')).toBe(false);
  });

  it('MESS with library, no customers → RESIDENTS_READY (optional, before planning)', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS', { hasMealLibrary: true, memberCount: 0 }),
    });
    expect(result.lifecycle).toBe('SETUP_IN_PROGRESS');
    expect(result.recommendation?.milestoneId).toBe('RESIDENTS_READY');
    expect(result.recommendation?.kind).toBe('optional');
  });

  it('MESS with library + customers, no today menu → TODAYS_MENU_READY', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS', {
        hasMealLibrary: true,
        memberCount: 3,
        hasTodaysMenuPlanned: false,
      }),
    });
    expect(result.recommendation?.milestoneId).toBe('TODAYS_MENU_READY');
  });

  it('MESS skips optional customers when dismissed → TODAYS_MENU_READY', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS', {
        hasMealLibrary: true,
        hasTodaysMenuPlanned: false,
        memberCount: 0,
        dismissedOptionalMilestoneIds: ['RESIDENTS_READY'],
      }),
    });
    expect(result.recommendation?.milestoneId).toBe('TODAYS_MENU_READY');
  });

  it('MESS planned menu before customers still recommends RESIDENTS_READY', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS', {
        hasMealLibrary: true,
        hasTodaysMenuPlanned: true,
        memberCount: 0,
      }),
    });
    expect(result.recommendation?.milestoneId).toBe('RESIDENTS_READY');
    expect(result.recommendation?.kind).toBe('optional');
  });

  it('MESS library + customers + menu, not shared → MENU_SHARED (required)', () => {
    const share = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS', {
        hasMealLibrary: true,
        hasTodaysMenuPlanned: true,
        memberCount: 5,
        hasMenuShared: false,
        deliveryLocationCount: 0,
      }),
    });
    expect(share.progress.isRequiredComplete).toBe(false);
    expect(share.recommendation?.milestoneId).toBe('MENU_SHARED');
    expect(share.recommendation?.kind).toBe('required');
    expect(share.lifecycle).toBe('SETUP_IN_PROGRESS');
  });

  it('MESS required done including share → READY + delivery tip', () => {
    const delivery = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS', {
        hasMealLibrary: true,
        hasTodaysMenuPlanned: true,
        memberCount: 5,
        hasMenuShared: true,
        deliveryLocationCount: 0,
      }),
    });
    expect(delivery.progress.isRequiredComplete).toBe(true);
    expect(delivery.lifecycle).toBe('READY');
    expect(delivery.recommendation?.milestoneId).toBe('DELIVERY_READY');
    expect(delivery.recommendation?.kind).toBe('recommended');
  });

  it('MESS fully ready including share + delivery → no recommendation', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'MESS',
      context: ctx('MESS', {
        hasMealLibrary: true,
        hasTodaysMenuPlanned: true,
        memberCount: 5,
        hasMenuShared: true,
        deliveryLocationCount: 2,
      }),
    });
    expect(result.recommendation).toBeNull();
    expect(result.lifecycle).toBe('READY');
  });

  it('skips PROPERTY_READY recommendation when user cannot manage accommodation', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', {}, staffPermissions('PG')),
    });
    // Staff cannot manage accommodation → skip to residents if permitted…
    // Staff also cannot manage members → no recommendation.
    expect(result.recommendation).toBeNull();
  });

  it('owner without meal manage still gets property recommendation', () => {
    const perms = ownerPermissions('PG');
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx(
        'PG',
        {},
        { ...perms, canManageMeals: false },
      ),
    });
    expect(result.recommendation?.milestoneId).toBe('PROPERTY_READY');
  });

  it('dismissed optional meals yields no recommendation when required done', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', {
        buildingCount: 1,
        bedCount: 2,
        memberCount: 1,
        hasMealLibrary: false,
        dismissedOptionalMilestoneIds: ['MEALS_READY'],
      }),
    });
    expect(result.recommendation).toBeNull();
  });

  it('pending during SETUP does not become NEEDS_ATTENTION', () => {
    const result = evaluateSpaceLifecycle({
      spaceType: 'PG',
      context: ctx('PG', { pendingActionCount: 5 }),
    });
    expect(result.lifecycle).toBe('NEW');
  });
});

describe('extensibility regression', () => {
  it('adding a future space type requires a profile entry via LIFECYCLE_SPACE_TYPES', () => {
    for (const type of LIFECYCLE_SPACE_TYPES) {
      const profile = setupProfileForSpaceType(type);
      expect(profile.spaceType).toBe(type);
      expect(profile.milestones.length).toBeGreaterThan(0);
      expect(profile.milestones[0].id).toBe('SPACE_CREATED');
    }
  });
});
