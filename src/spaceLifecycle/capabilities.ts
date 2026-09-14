import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { servingLocationMode } from '../utils/servingLocationPolicy';
import { isPropertyReady } from './predicates';
import type { PredicateContext, SetupNavigationTarget } from './types';

/**
 * Progressive Guided Access — capability layer on top of lifecycle signals.
 * Does not replace milestones; answers HIDDEN | LOCKED | SOFT | AVAILABLE.
 */

export type CapabilityId =
  | 'ACCOMMODATION'
  | 'MEMBERS'
  | 'MEAL_CONFIG'
  | 'MEAL_OPS'
  | 'ALLOCATION'
  | 'PAYMENTS'
  | 'COMPLAINTS'
  | 'INVENTORY'
  | 'DELIVERY';

export type AccessMode = 'HIDDEN' | 'LOCKED' | 'SOFT' | 'AVAILABLE';

export type CapabilityAccess = {
  id: CapabilityId;
  mode: AccessMode;
  /** i18n key for why locked/soft (optional for AVAILABLE/HIDDEN). */
  reasonKey: string | null;
  /** i18n key for CTA label when locked/soft has an action. */
  ctaLabelKey: string | null;
  /** Where the CTA should navigate when unlocking. */
  unlockTarget: SetupNavigationTarget | null;
};

export type SpaceCapabilitiesResult = {
  progressiveOperator: boolean;
  byId: Record<CapabilityId, CapabilityAccess>;
  list: CapabilityAccess[];
};

const CAPABILITY_IDS: CapabilityId[] = [
  'ACCOMMODATION',
  'MEMBERS',
  'MEAL_CONFIG',
  'MEAL_OPS',
  'ALLOCATION',
  'PAYMENTS',
  'COMPLAINTS',
  'INVENTORY',
  'DELIVERY',
];

function access(
  id: CapabilityId,
  mode: AccessMode,
  reasonKey: string | null = null,
  ctaLabelKey: string | null = null,
  unlockTarget: SetupNavigationTarget | null = null,
): CapabilityAccess {
  return { id, mode, reasonKey, ctaLabelKey, unlockTarget };
}

/**
 * Owner/Manager (and meal/occupancy managers) get progressive gates.
 * TENANT/CUSTOMER never receive LOCKED modes from this layer.
 */
export function isProgressiveOperator(ctx: PredicateContext): boolean {
  const p = ctx.permissions;
  return (
    p.canManageMembers === true ||
    p.canManageAccommodation === true ||
    p.canManageOccupancy === true ||
    p.canManageMeals === true
  );
}

function mealLibraryReady(ctx: PredicateContext): boolean {
  // Seeded sample combos/items count — owners can plan immediately and edit later.
  return ctx.hasMealLibrary;
}

function allocatedCount(ctx: PredicateContext): number {
  return ctx.allocatedMemberCount ?? 0;
}

function billable(ctx: PredicateContext): boolean {
  return ctx.hasBillableActivity === true;
}

/**
 * Pure capability evaluation from PredicateContext (same signals as lifecycle).
 */
export function evaluateSpaceCapabilities(
  ctx: PredicateContext,
): SpaceCapabilitiesResult {
  const progressiveOperator = isProgressiveOperator(ctx);
  const lodging = isAccommodationApplicable(ctx.spaceType);
  const isMess = ctx.spaceType === 'MESS';
  const isRental = ctx.spaceType === 'RENTAL';
  const propertyReady = isPropertyReady(ctx);
  const hasMembers = ctx.memberCount > 0;
  const libraryReady = mealLibraryReady(ctx);
  const p = ctx.permissions;

  const byId = {} as Record<CapabilityId, CapabilityAccess>;

  // --- ACCOMMODATION ---
  if (!lodging || !p.canViewAccommodation) {
    byId.ACCOMMODATION = access('ACCOMMODATION', 'HIDDEN');
  } else {
    byId.ACCOMMODATION = access('ACCOMMODATION', 'AVAILABLE');
  }

  // --- MEMBERS (D1: hard UX gate after property for lodging) ---
  if (!p.canManageMembers) {
    byId.MEMBERS = access('MEMBERS', 'HIDDEN');
  } else if (!progressiveOperator) {
    byId.MEMBERS = access('MEMBERS', 'AVAILABLE');
  } else if (lodging && !propertyReady) {
    byId.MEMBERS = access(
      'MEMBERS',
      'LOCKED',
      'spaceLifecycle.capabilities.members.lockedProperty',
      'spaceLifecycle.capabilities.members.ctaProperty',
      'QUICK_SETUP',
    );
  } else {
    byId.MEMBERS = access('MEMBERS', 'AVAILABLE');
  }

  // --- MEAL_CONFIG (D2: config after property for lodging; early for Mess) ---
  if (isRental || !p.canManageMeals) {
    byId.MEAL_CONFIG = access('MEAL_CONFIG', 'HIDDEN');
  } else if (!progressiveOperator) {
    byId.MEAL_CONFIG = access('MEAL_CONFIG', 'AVAILABLE');
  } else if (lodging && !propertyReady) {
    byId.MEAL_CONFIG = access(
      'MEAL_CONFIG',
      'LOCKED',
      'spaceLifecycle.capabilities.mealConfig.lockedProperty',
      'spaceLifecycle.capabilities.mealConfig.ctaProperty',
      'QUICK_SETUP',
    );
  } else {
    byId.MEAL_CONFIG = access('MEAL_CONFIG', 'AVAILABLE');
  }

  // --- MEAL_OPS (plan/poll — after meal library exists; lodging also needs allocation) ---
  if (isRental) {
    byId.MEAL_OPS = access('MEAL_OPS', 'HIDDEN');
  } else if (!p.canManageMeals && !p.canViewMeals) {
    byId.MEAL_OPS = access('MEAL_OPS', 'HIDDEN');
  } else if (!progressiveOperator || !p.canManageMeals) {
    // Consumers / staff viewers: never locked by owner setup.
    byId.MEAL_OPS = access('MEAL_OPS', p.canViewMeals ? 'AVAILABLE' : 'HIDDEN');
  } else if (!libraryReady) {
    byId.MEAL_OPS = access(
      'MEAL_OPS',
      'LOCKED',
      isMess
        ? 'spaceLifecycle.capabilities.mealOps.lockedLibraryMess'
        : 'spaceLifecycle.capabilities.mealOps.lockedLibrary',
      'spaceLifecycle.capabilities.mealOps.ctaLibrary',
      'MENU_LIBRARY',
    );
  } else if (lodging && allocatedCount(ctx) <= 0) {
    byId.MEAL_OPS = access(
      'MEAL_OPS',
      'LOCKED',
      'spaceLifecycle.capabilities.mealOps.lockedAllocation',
      'spaceLifecycle.capabilities.mealOps.ctaAllocation',
      'MEMBERS',
    );
  } else {
    byId.MEAL_OPS = access('MEAL_OPS', 'AVAILABLE');
  }

  // --- ALLOCATION (D3) ---
  if (!lodging || !p.canManageOccupancy) {
    byId.ALLOCATION = access('ALLOCATION', 'HIDDEN');
  } else if (!progressiveOperator) {
    byId.ALLOCATION = access('ALLOCATION', 'AVAILABLE');
  } else if (!propertyReady) {
    byId.ALLOCATION = access(
      'ALLOCATION',
      'LOCKED',
      'spaceLifecycle.capabilities.allocation.lockedProperty',
      'spaceLifecycle.capabilities.allocation.ctaProperty',
      'QUICK_SETUP',
    );
  } else if (!hasMembers) {
    byId.ALLOCATION = access(
      'ALLOCATION',
      'LOCKED',
      'spaceLifecycle.capabilities.allocation.lockedMembers',
      'spaceLifecycle.capabilities.allocation.ctaMembers',
      'ADD_MEMBER',
    );
  } else {
    byId.ALLOCATION = access('ALLOCATION', 'AVAILABLE');
  }

  // --- PAYMENTS (D4: soft until billable) ---
  if (!progressiveOperator) {
    byId.PAYMENTS = access('PAYMENTS', 'AVAILABLE');
  } else if (!billable(ctx)) {
    byId.PAYMENTS = access(
      'PAYMENTS',
      'SOFT',
      'spaceLifecycle.capabilities.payments.soft',
      null,
      null,
    );
  } else {
    byId.PAYMENTS = access('PAYMENTS', 'AVAILABLE');
  }

  // --- COMPLAINTS (D5: soft until members; no move-in requirement) ---
  if (!p.canRaiseComplaint && !p.canViewAllComplaints) {
    byId.COMPLAINTS = access('COMPLAINTS', 'HIDDEN');
  } else if (progressiveOperator && !hasMembers) {
    byId.COMPLAINTS = access(
      'COMPLAINTS',
      'SOFT',
      'spaceLifecycle.capabilities.complaints.soft',
      'spaceLifecycle.capabilities.complaints.ctaMembers',
      'ADD_MEMBER',
    );
  } else {
    byId.COMPLAINTS = access('COMPLAINTS', 'AVAILABLE');
  }

  // --- INVENTORY (independent) ---
  if (p.canViewInventory !== true) {
    byId.INVENTORY = access('INVENTORY', 'HIDDEN');
  } else {
    byId.INVENTORY = access('INVENTORY', 'AVAILABLE');
  }

  // --- DELIVERY (Mess recommended) ---
  if (servingLocationMode(ctx.spaceType) !== 'delivery') {
    byId.DELIVERY = access('DELIVERY', 'HIDDEN');
  } else if (!p.canManageMeals) {
    byId.DELIVERY = access('DELIVERY', 'HIDDEN');
  } else if (ctx.deliveryLocationCount <= 0) {
    byId.DELIVERY = access(
      'DELIVERY',
      'SOFT',
      'spaceLifecycle.capabilities.delivery.soft',
      'spaceLifecycle.capabilities.delivery.cta',
      'DELIVERY_LOCATIONS',
    );
  } else {
    byId.DELIVERY = access('DELIVERY', 'AVAILABLE');
  }

  const list = CAPABILITY_IDS.map(id => byId[id]);
  return { progressiveOperator, byId, list };
}

export function getCapability(
  result: SpaceCapabilitiesResult,
  id: CapabilityId,
): CapabilityAccess {
  return result.byId[id];
}

export function isCapabilityOpen(
  result: SpaceCapabilitiesResult,
  id: CapabilityId,
): boolean {
  const mode = result.byId[id]?.mode;
  return mode === 'AVAILABLE' || mode === 'SOFT';
}

export function isCapabilityLocked(
  result: SpaceCapabilitiesResult,
  id: CapabilityId,
): boolean {
  return result.byId[id]?.mode === 'LOCKED';
}
