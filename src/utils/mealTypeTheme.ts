import type { MealType } from '../api/types';

/**
 * Meal card chrome. Borders must stay neutral gray (#E5E7EB).
 * Using theme `colors.border` (#DCEFE3 mint) makes Lunch look selected
 * against its green soft fill.
 */
export type MealTypeTheme = {
  accent: string;
  soft: string;
  border: string;
  borderStrong: string;
};

const NEUTRAL_BORDER = '#E5E7EB';

export const MEAL_TYPE_THEME: Record<MealType, MealTypeTheme> = {
  BREAKFAST: {
    accent: '#D97706',
    soft: '#FFF7ED',
    border: NEUTRAL_BORDER,
    borderStrong: NEUTRAL_BORDER,
  },
  LUNCH: {
    accent: '#0F766E',
    soft: '#F0FDFA',
    border: NEUTRAL_BORDER,
    borderStrong: NEUTRAL_BORDER,
  },
  DINNER: {
    accent: '#6366F1',
    soft: '#EEF2FF',
    border: NEUTRAL_BORDER,
    borderStrong: NEUTRAL_BORDER,
  },
};

export function mealTypeTheme(mealType: MealType): MealTypeTheme {
  return MEAL_TYPE_THEME[mealType];
}
