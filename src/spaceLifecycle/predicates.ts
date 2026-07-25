import {
  getAccommodationUiProfile,
  isAccommodationApplicable,
} from '../utils/accommodationProfile';
import { getAllowedTargetTypes } from '../utils/occupancyRules';
import { servingLocationMode } from '../utils/servingLocationPolicy';
import type { MilestoneId, PredicateContext } from './types';

/**
 * Pure predicates — answer one business question using PredicateContext only.
 * No network I/O. Reuse existing gates for applicability.
 */

export function isSpaceCreated(ctx: PredicateContext): boolean {
  return ctx.spaceExists;
}

/**
 * Property inventory ready for allocation.
 * - Bed-oriented types (PG/Hostel/Co-living): buildings + beds
 * - Rental: buildings + units (no beds in UI profile)
 * - Mess: not applicable (caller should not evaluate)
 */
export function isPropertyReady(ctx: PredicateContext): boolean {
  if (!isAccommodationApplicable(ctx.spaceType)) {
    return true;
  }
  if (ctx.buildingCount <= 0) {
    return false;
  }

  const targets = getAllowedTargetTypes(ctx.spaceType);
  const profile = getAccommodationUiProfile(ctx.spaceType);

  if (targets.includes('UNIT') && profile && !profile.showBeds) {
    return ctx.unitCount > 0;
  }

  // Default lodging path: allocatable beds.
  return ctx.bedCount > 0;
}

export function isResidentsReady(ctx: PredicateContext): boolean {
  return ctx.memberCount > 0;
}

export function isMealsReady(ctx: PredicateContext): boolean {
  return ctx.hasMealLibrary;
}

export function isTodaysMenuReady(ctx: PredicateContext): boolean {
  return ctx.hasTodaysMenuPlanned;
}

export function isMenuShared(ctx: PredicateContext): boolean {
  return ctx.hasMenuShared;
}

export function isDeliveryReady(ctx: PredicateContext): boolean {
  if (servingLocationMode(ctx.spaceType) !== 'delivery') {
    return true;
  }
  return ctx.deliveryLocationCount > 0;
}

/** Derived: all required profile milestones complete (set by evaluate). */
export function isOpsReady(requiredComplete: boolean): boolean {
  return requiredComplete;
}

export function evaluateMilestonePredicate(
  milestoneId: MilestoneId,
  ctx: PredicateContext,
  requiredComplete: boolean,
): boolean {
  switch (milestoneId) {
    case 'SPACE_CREATED':
      return isSpaceCreated(ctx);
    case 'PROPERTY_READY':
      return isPropertyReady(ctx);
    case 'RESIDENTS_READY':
      return isResidentsReady(ctx);
    case 'MEALS_READY':
      return isMealsReady(ctx);
    case 'TODAYS_MENU_READY':
      return isTodaysMenuReady(ctx);
    case 'MENU_SHARED':
      return isMenuShared(ctx);
    case 'DELIVERY_READY':
      return isDeliveryReady(ctx);
    case 'OPS_READY':
      return isOpsReady(requiredComplete);
    default: {
      const _exhaustive: never = milestoneId;
      return _exhaustive;
    }
  }
}

/** True when property structure is missing (auto-open Accommodation signal). */
export function needsPropertyStructure(ctx: PredicateContext): boolean {
  return isAccommodationApplicable(ctx.spaceType) && ctx.buildingCount <= 0;
}
