import { getMilestoneDefinition } from './milestones';
import type {
  MilestoneKind,
  MilestoneStatus,
  PredicateContext,
  RecommendedAction,
  SetupProfile,
} from './types';

const KIND_PRIORITY: Record<Exclude<MilestoneKind, 'derived'>, number> = {
  required: 100,
  recommended: 50,
  optional: 10,
};

function canRecommend(
  status: MilestoneStatus,
  profileMilestone: SetupProfile['milestones'][number],
  ctx: PredicateContext,
): boolean {
  if (!status.applies || status.done) {
    return false;
  }
  if (status.kind === 'derived') {
    return false;
  }
  if (status.kind === 'optional') {
    const dismissed = ctx.dismissedOptionalMilestoneIds ?? [];
    if (dismissed.includes(status.id)) {
      return false;
    }
  }
  const permissionKey = profileMilestone.requiredPermission;
  if (permissionKey && ctx.permissions[permissionKey] !== true) {
    return false;
  }
  return true;
}

function buildAction(
  status: MilestoneStatus,
  kind: Exclude<MilestoneKind, 'derived'>,
  spaceType: PredicateContext['spaceType'],
): RecommendedAction {
  const def = getMilestoneDefinition(status.id);
  const stem =
    spaceType === 'MESS'
      ? messRecommendationStem(status.id) ?? def.i18nKeyStem
      : def.i18nKeyStem;
  return {
    milestoneId: status.id,
    kind,
    priority: KIND_PRIORITY[kind],
    navigationTarget: status.navigationTarget ?? 'DASHBOARD',
    titleKey: `${stem}.title`,
    reasonKey: `${stem}.reason`,
    ctaLabelKey: `${stem}.cta`,
  };
}

/** Mess-facing business copy for shared milestone IDs. */
function messRecommendationStem(id: MilestoneStatus['id']): string | null {
  switch (id) {
    case 'SPACE_CREATED':
      return 'spaceLifecycle.milestones.mess.spaceCreated';
    case 'MEALS_READY':
      return 'spaceLifecycle.milestones.mess.mealsReady';
    case 'TODAYS_MENU_READY':
      return 'spaceLifecycle.milestones.mess.todaysMenuReady';
    case 'RESIDENTS_READY':
      return 'spaceLifecycle.milestones.mess.residentsReady';
    case 'MENU_SHARED':
      return 'spaceLifecycle.milestones.mess.menuShared';
    case 'DELIVERY_READY':
      return 'spaceLifecycle.milestones.mess.deliveryReady';
    case 'OPS_READY':
      return 'spaceLifecycle.milestones.mess.opsReady';
    default:
      return null;
  }
}

/**
 * Returns the single highest-priority incomplete action:
 * required → recommended → optional (permission-filtered).
 *
 * Mess exception: after menu library is ready, surface optional "Add customers"
 * (with Skip) before later required steps — unless dismissed or already done.
 */
export function recommendNextAction(
  profile: SetupProfile,
  statuses: MilestoneStatus[],
  ctx: PredicateContext,
): RecommendedAction | null {
  const byId = new Map(statuses.map(s => [s.id, s]));

  if (ctx.spaceType === 'MESS') {
    const meals = byId.get('MEALS_READY');
    const residents = byId.get('RESIDENTS_READY');
    const residentsProfile = profile.milestones.find(m => m.id === 'RESIDENTS_READY');
    if (
      meals?.done &&
      residents &&
      residentsProfile &&
      canRecommend(residents, residentsProfile, ctx)
    ) {
      return buildAction(residents, 'optional', ctx.spaceType);
    }
  }

  const orderedKinds: Array<Exclude<MilestoneKind, 'derived'>> = [
    'required',
    'recommended',
    'optional',
  ];

  for (const kind of orderedKinds) {
    for (const profileMilestone of profile.milestones) {
      if (profileMilestone.kind !== kind) {
        continue;
      }
      const status = byId.get(profileMilestone.id);
      if (!status) {
        continue;
      }
      if (!canRecommend(status, profileMilestone, ctx)) {
        continue;
      }
      return buildAction(status, kind, ctx.spaceType);
    }
  }

  return null;
}
