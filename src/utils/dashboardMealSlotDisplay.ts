import type { DailyMenuResponse, MealPollSlot, MealType } from '../api/types';
import { MEAL_TYPES } from './mealLabels';
import type { MenuPlanningStatusFilter } from './menuPlanningFilter';
import { slotPlanningStatus } from './menuPlanningFilter';
import { resolveMealStatusKind, type MealStatusKind } from './mealStatusTheme';

export type DashboardMealSlotCaptionTone = 'muted' | 'progress' | 'complete';

export type DashboardMealSlotRow = {
  mealType: MealType;
  status: MenuPlanningStatusFilter;
  statusLabelKey: string;
  captionKey: string;
  captionParams?: Record<string, number>;
  /** Large primary metric, e.g. "1 / 4" or "4". */
  countPrimary?: string;
  /** Smaller unit under the metric. */
  countUnitKey?: string;
  /** Glanceable indicator for poll progress / closed plates. */
  captionTone: DashboardMealSlotCaptionTone;
  /** Canonical badge kind for MealStatusBadge. */
  statusKind: MealStatusKind;
};

export function resolveDashboardMealSlotCaption(
  status: MenuPlanningStatusFilter,
  poll?: MealPollSlot | null,
  eligibleCount = 0,
  _platesCount?: number | null,
): Pick<
  DashboardMealSlotRow,
  'captionKey' | 'captionParams' | 'captionTone' | 'countPrimary' | 'countUnitKey'
> {
  if (status === 'not_planned') {
    return { captionKey: 'meals.planning.cardHintEmpty', captionTone: 'muted' };
  }
  if (status === 'modified') {
    return { captionKey: 'meals.planning.cardHintNeedsReshare', captionTone: 'muted' };
  }
  if (status === 'draft') {
    return { captionKey: 'meals.planning.cardHintDraft', captionTone: 'muted' };
  }

  const responded = poll?.responseCount ?? 0;
  const eligible = Math.max(eligibleCount, 0);

  if (poll?.status === 'CLOSED') {
    return {
      captionKey: 'meals.planning.cardHintPollClosed',
      captionParams: { responded, eligible },
      captionTone: 'muted',
    };
  }

  if (poll != null) {
    return {
      captionKey: 'meals.planning.cardHintResponses',
      captionParams: { responded, eligible },
      countPrimary: `${responded} / ${eligible}`,
      countUnitKey: 'dashboard.operations.respondedUnit',
      captionTone:
        eligible > 0 && responded >= eligible
          ? 'complete'
          : responded > 0
            ? 'progress'
            : 'muted',
    };
  }

  return { captionKey: 'meals.planning.cardHintShared', captionTone: 'muted' };
}

function mealStatusLabelKeyForKind(kind: MealStatusKind): string {
  if (kind === 'empty') {
    return 'meals.status.empty';
  }
  if (kind === 'draft') {
    return 'meals.status.notShared';
  }
  if (kind === 'needs_reshare') {
    return 'meals.status.needsReshare';
  }
  return 'meals.status.shared';
}

export function buildDashboardMealSlotRows(
  menuMap: Partial<Record<MealType, DailyMenuResponse>>,
  pollMap: Partial<Record<MealType, MealPollSlot>>,
  eligibleByMeal: Partial<Record<MealType, number>> = {},
  platesByMeal: Partial<Record<MealType, number>> = {},
  fallbackEligibleCount = 0,
): DashboardMealSlotRow[] {
  return MEAL_TYPES.map(mealType => {
    const menu = menuMap[mealType];
    const status = slotPlanningStatus(menu);
    const poll = pollMap[mealType];
    const eligible = eligibleByMeal[mealType] ?? fallbackEligibleCount;
    const caption = resolveDashboardMealSlotCaption(
      status,
      poll,
      eligible,
      platesByMeal[mealType],
    );
    const statusKind = resolveMealStatusKind(menu, poll);
    return {
      mealType,
      status,
      statusKind,
      statusLabelKey: mealStatusLabelKeyForKind(statusKind),
      ...caption,
    };
  });
}
