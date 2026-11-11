import type { DailyMenuResponse, MealPollSlot } from '../api/types';
import { slotPlanningStatus } from './menuPlanningFilter';

/**
 * Primary meal-card status = menu publication only.
 * Poll open/closed is secondary metadata shown under the badge.
 *
 * Visual presentation folds into three operator-facing statuses:
 * - EMPTY (orange)
 * - READY TO SHARE (blue) — covers draft + needs_reshare
 * - SHARED (green)
 */
export type MealStatusKind = 'empty' | 'draft' | 'shared' | 'needs_reshare';

export type MealStatusTheme = {
  /** Primary text / meal-name colour */
  color: string;
  /** Full card background */
  background: string;
  /** Card border */
  border: string;
  /** Solid status-badge fill */
  badgeBackground: string;
  /** Status-badge label / icon colour */
  badgeForeground: string;
  labelKey: string;
};

/** Blue accent for poll-response secondary lines (not a menu status). */
export const MENU_PLANNING_POLL_OPEN_COLOR = '#2563EB';

export const MEAL_STATUS_THEME: Record<MealStatusKind, MealStatusTheme> = {
  empty: {
    color: '#A96016',
    background: '#FFF1E3',
    border: '#F4C99B',
    badgeBackground: '#D97706',
    badgeForeground: '#FFFFFF',
    labelKey: 'meals.status.empty',
  },
  draft: {
    color: '#285DA5',
    background: '#E8F1FF',
    border: '#A9C8F4',
    badgeBackground: '#1769B0',
    badgeForeground: '#FFFFFF',
    labelKey: 'meals.status.notShared',
  },
  shared: {
    color: '#176B40',
    background: '#E5F6EC',
    border: '#9AD9B2',
    badgeBackground: '#16834B',
    badgeForeground: '#FFFFFF',
    labelKey: 'meals.status.shared',
  },
  /**
   * Edited after share → treat visually as READY TO SHARE (blue).
   * Business kind stays `needs_reshare` so workflows can still branch.
   */
  needs_reshare: {
    color: '#285DA5',
    background: '#E8F1FF',
    border: '#A9C8F4',
    badgeBackground: '#1769B0',
    badgeForeground: '#FFFFFF',
    labelKey: 'meals.status.notShared',
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

/** True when the visual presentation is the blue READY TO SHARE bucket. */
export function isReadyToShareKind(kind: MealStatusKind): boolean {
  return kind === 'draft' || kind === 'needs_reshare';
}
