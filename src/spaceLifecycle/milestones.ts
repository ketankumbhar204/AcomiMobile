import type { MilestoneDefinition, MilestoneId } from './types';

/**
 * Canonical milestone catalog — IDs and metadata only (no UI strings).
 * Owner-facing copy lives in i18n and is wired in later phases.
 */
export const MILESTONE_CATALOG: Record<MilestoneId, MilestoneDefinition> = {
  SPACE_CREATED: {
    id: 'SPACE_CREATED',
    i18nKeyStem: 'spaceLifecycle.milestones.spaceCreated',
  },
  PROPERTY_READY: {
    id: 'PROPERTY_READY',
    i18nKeyStem: 'spaceLifecycle.milestones.propertyReady',
  },
  RESIDENTS_READY: {
    id: 'RESIDENTS_READY',
    i18nKeyStem: 'spaceLifecycle.milestones.residentsReady',
  },
  MEALS_READY: {
    id: 'MEALS_READY',
    i18nKeyStem: 'spaceLifecycle.milestones.mealsReady',
  },
  TODAYS_MENU_READY: {
    id: 'TODAYS_MENU_READY',
    i18nKeyStem: 'spaceLifecycle.milestones.todaysMenuReady',
  },
  MENU_SHARED: {
    id: 'MENU_SHARED',
    i18nKeyStem: 'spaceLifecycle.milestones.menuShared',
  },
  DELIVERY_READY: {
    id: 'DELIVERY_READY',
    i18nKeyStem: 'spaceLifecycle.milestones.deliveryReady',
  },
  OPS_READY: {
    id: 'OPS_READY',
    i18nKeyStem: 'spaceLifecycle.milestones.opsReady',
  },
};

export const ALL_MILESTONE_IDS: MilestoneId[] = Object.keys(
  MILESTONE_CATALOG,
) as MilestoneId[];

export function getMilestoneDefinition(id: MilestoneId): MilestoneDefinition {
  return MILESTONE_CATALOG[id];
}
