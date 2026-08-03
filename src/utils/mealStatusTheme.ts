import type { DailyMenuResponse, MealPollSlot } from '../api/types';
import { colors } from '../theme';
import { slotPlanningStatus } from './menuPlanningFilter';

/**
 * Primary meal-card status = menu publication only.
 * Poll open/closed is secondary metadata shown under the badge.
 */
export type MealStatusKind = 'empty' | 'draft' | 'shared' | 'needs_reshare';

export type MealStatusTheme = {
  color: string;
  background: string;
  icon: string;
  labelKey: string;
};

/** Blue accent for poll-response secondary lines (not a menu status). */
export const MENU_PLANNING_POLL_OPEN_COLOR = '#2563EB';

export const MEAL_STATUS_THEME: Record<MealStatusKind, MealStatusTheme> = {
  empty: {
    color: colors.muted,
    background: colors.surfaceSecondary,
    icon: '○',
    labelKey: 'meals.status.empty',
  },
  draft: {
    color: '#D97706',
    background: colors.warningTint,
    icon: '●',
    labelKey: 'meals.status.notShared',
  },
  shared: {
    color: colors.success,
    background: colors.successTint,
    icon: '✓',
    labelKey: 'meals.status.shared',
  },
  needs_reshare: {
    color: '#B45309',
    background: colors.warningTint,
    icon: '⚠',
    labelKey: 'meals.status.needsReshare',
  },
};

/**
 * Resolve primary menu publication status for badges.
 * Poll state must not replace Shared — use secondary hint lines instead.
 */
export function resolveMealStatusKind(
  menu?: DailyMenuResponse | null,
  _poll?: Pick<MealPollSlot, 'status'> | null,
): MealStatusKind {
  const planning = slotPlanningStatus(menu);
  if (planning === 'not_planned') {
    return 'empty';
  }
  if (planning === 'draft') {
    return 'draft';
  }
  if (planning === 'modified') {
    return 'needs_reshare';
  }
  return 'shared';
}

export function mealStatusTheme(kind: MealStatusKind): MealStatusTheme {
  return MEAL_STATUS_THEME[kind];
}
