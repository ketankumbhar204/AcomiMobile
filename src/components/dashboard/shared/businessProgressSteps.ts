import type { MilestoneId, MilestoneStatus, SpaceType } from '../../spaceLifecycle';
import type { BusinessProgressStep } from './BusinessProgressStepper';

/** Map lifecycle milestone statuses to stepper steps. */
export function buildBusinessProgressSteps(
  milestones: MilestoneStatus[],
  labelFor: (id: MilestoneId) => string,
  options?: { includeRecommended?: boolean; includeOptional?: boolean },
): BusinessProgressStep[] {
  const includeRecommended = options?.includeRecommended === true;
  const includeOptional = options?.includeOptional !== false;
  return milestones
    .filter(m => {
      if (!m.applies || m.kind === 'derived') {
        return false;
      }
      if (m.kind === 'required') {
        return true;
      }
      if (m.kind === 'optional') {
        return includeOptional;
      }
      return includeRecommended && m.kind === 'recommended';
    })
    .map(m => ({
      id: m.id,
      label: labelFor(m.id),
    }));
}

/**
 * Index of the highlighted step.
 * Prefer the recommended milestone when provided so Next Step and stepper stay in sync.
 * Skipped optionals are not treated as completed for the highlight.
 */
export function businessProgressCurrentIndex(
  milestones: MilestoneStatus[],
  steps: BusinessProgressStep[],
  options?: {
    dismissedOptionalIds?: readonly MilestoneId[];
    /** Highlight this milestone when it appears in the stepper (e.g. next recommendation). */
    focusMilestoneId?: MilestoneId | null;
  },
): number {
  if (options?.focusMilestoneId) {
    const focused = steps.findIndex(step => step.id === options.focusMilestoneId);
    if (focused >= 0) {
      return focused;
    }
  }

  const byId = new Map(milestones.map(m => [m.id, m]));
  const dismissed = new Set(options?.dismissedOptionalIds ?? []);
  const idx = steps.findIndex(step => {
    const status = byId.get(step.id as MilestoneId);
    if (!status) {
      return true;
    }
    if (status.done) {
      return false;
    }
    // Skipped optional: not done — keep scanning so required next can be current
    // when no focusMilestoneId is provided.
    if (status.kind === 'optional' && dismissed.has(status.id)) {
      return false;
    }
    return true;
  });
  return idx === -1 ? steps.length : idx;
}

export function milestoneLabelKeyForSpace(
  id: MilestoneId,
  spaceType: SpaceType | null | undefined,
): string {
  const isMess = spaceType === 'MESS';
  if (isMess) {
    switch (id) {
      case 'SPACE_CREATED':
        return 'dashboard.setup.milestones.mess.spaceCreated';
      case 'MEALS_READY':
        return 'dashboard.setup.milestones.mess.mealsReady';
      case 'TODAYS_MENU_READY':
        return 'dashboard.setup.milestones.mess.todaysMenuReady';
      case 'RESIDENTS_READY':
        return 'dashboard.setup.milestones.mess.residentsReady';
      case 'MENU_SHARED':
        return 'dashboard.setup.milestones.mess.menuShared';
      case 'DELIVERY_READY':
        return 'dashboard.setup.milestones.mess.deliveryReady';
      case 'OPS_READY':
        return 'dashboard.setup.milestones.mess.opsReady';
      default:
        break;
    }
  }

  switch (id) {
    case 'SPACE_CREATED':
      return 'dashboard.setup.milestones.spaceCreated';
    case 'PROPERTY_READY':
      return 'dashboard.setup.milestones.propertyReady';
    case 'RESIDENTS_READY':
      return 'dashboard.setup.milestones.residentsReady';
    case 'MEALS_READY':
      return 'dashboard.setup.milestones.mealsReady';
    case 'TODAYS_MENU_READY':
      return 'dashboard.setup.milestones.todaysMenuReady';
    case 'MENU_SHARED':
      return 'dashboard.setup.milestones.menuShared';
    case 'DELIVERY_READY':
      return 'dashboard.setup.milestones.deliveryReady';
    case 'OPS_READY':
      return 'dashboard.setup.milestones.opsReady';
    default:
      return 'dashboard.setup.milestones.spaceCreated';
  }
}
