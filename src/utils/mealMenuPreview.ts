import type { MealPollOption, MealPollSlot, MealType } from '../api/types';
import { MEAL_TYPES } from './mealLabels';

const PREVIEW_LIMIT = 2;

export type MealMenuPreviewSection = {
  mealType: MealType;
  /** Up to PREVIEW_LIMIT main (non-extra) labels; falls back to extras if no mains. */
  labels: string[];
  remainingCount: number;
};

/**
 * Lightweight dashboard preview from poll options already on the client.
 * Prefers non-extra MENU_ENTRY labels; no extra API calls.
 */
export function buildMenuPreviewFromPolls(polls: MealPollSlot[]): MealMenuPreviewSection[] {
  const byType = new Map(polls.map(poll => [poll.mealType, poll]));
  const sections: MealMenuPreviewSection[] = [];

  for (const mealType of MEAL_TYPES) {
    const poll = byType.get(mealType);
    if (!poll) {
      continue;
    }
    const menuEntries = poll.options.filter(
      (option): option is MealPollOption => option.optionType === 'MENU_ENTRY',
    );
    const mains = menuEntries.filter(option => option.isExtra !== true);
    const extras = menuEntries.filter(option => option.isExtra === true);
    const ordered = mains.length > 0 ? [...mains, ...extras] : extras;
    const labels = ordered.slice(0, PREVIEW_LIMIT).map(option => option.label);
    const remainingCount = Math.max(0, ordered.length - labels.length);
    if (labels.length === 0) {
      continue;
    }
    sections.push({ mealType, labels, remainingCount });
  }

  return sections;
}
