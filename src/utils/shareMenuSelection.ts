import { mealsApi } from '../api/mealsApi';
import type { DailyMenuResponse, MealType, UUID } from '../api/types';
import { MEAL_TYPES } from './mealLabels';

export type SlotShareState = 'shareable' | 'notPublished' | 'draft' | 'empty';

export function hasAvailableMenuOptions(menu?: DailyMenuResponse | null): boolean {
  return (menu?.options?.filter(option => option.isAvailable) ?? []).length > 0;
}

export function getSlotShareState(menu?: DailyMenuResponse | null): SlotShareState {
  if (!menu) {
    return 'notPublished';
  }
  const hasItems = hasAvailableMenuOptions(menu);
  if (menu.status === 'PUBLISHED') {
    return hasItems ? 'shareable' : 'empty';
  }
  if (menu.status === 'DRAFT') {
    return hasItems ? 'draft' : 'empty';
  }
  return 'notPublished';
}

export function menusByMealType(
  menus: DailyMenuResponse[],
): Partial<Record<MealType, DailyMenuResponse>> {
  return menus.reduce<Partial<Record<MealType, DailyMenuResponse>>>((acc, menu) => {
    acc[menu.mealType] = menu;
    return acc;
  }, {});
}

export function defaultSelectedMealTypes(
  menuMap: Partial<Record<MealType, DailyMenuResponse>>,
  initialMealType?: MealType,
): MealType[] {
  if (initialMealType) {
    return getSlotShareState(menuMap[initialMealType]) === 'shareable' ? [initialMealType] : [];
  }
  return MEAL_TYPES.filter(type => getSlotShareState(menuMap[type]) === 'shareable');
}

function formatMealTypeLabel(mealType: MealType): string {
  const name = mealType.toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function parseEligibleCount(messageText: string): number {
  const match = messageText.match(/Eligible participants:\s*(\d+)\s*$/m);
  return match ? Number(match[1]) : 0;
}

function extractSlotBody(messageText: string): string {
  const headerEnd = messageText.indexOf('\n\n');
  let body = headerEnd >= 0 ? messageText.slice(headerEnd + 2) : messageText;
  const eligibleIdx = body.lastIndexOf('Eligible participants:');
  if (eligibleIdx >= 0) {
    body = body.slice(0, eligibleIdx).trim();
  }
  return body;
}

function stripMealTypeFromHeader(header: string): string {
  return header.replace(/ · [A-Za-z]+$/, '');
}

export function composeShareMessages(
  parts: Array<{ mealType: MealType; messageText: string }>,
): string {
  if (parts.length === 0) {
    return '';
  }
  if (parts.length === 1) {
    return parts[0].messageText.trim();
  }

  const headerEnd = parts[0].messageText.indexOf('\n\n');
  const header =
    headerEnd >= 0
      ? stripMealTypeFromHeader(parts[0].messageText.slice(0, headerEnd))
      : stripMealTypeFromHeader(parts[0].messageText);

  const lines: string[] = [header, ''];
  for (const part of parts) {
    lines.push(formatMealTypeLabel(part.mealType));
    lines.push(extractSlotBody(part.messageText));
    lines.push('');
  }

  const eligibleSummary = parts
    .map(part => `${formatMealTypeLabel(part.mealType)} ${parseEligibleCount(part.messageText)}`)
    .join(' · ');
  lines.push(`Eligible participants: ${eligibleSummary}`);
  return lines.join('\n').trim();
}

export async function buildShareMessageForSelection(
  spaceId: UUID,
  menuDate: string,
  mealTypes: MealType[],
): Promise<string> {
  if (mealTypes.length === 0) {
    return '';
  }
  const previews = await Promise.all(
    mealTypes.map(type => mealsApi.getSharePreview(spaceId, menuDate, type)),
  );
  return composeShareMessages(
    previews.map((preview, index) => ({
      mealType: mealTypes[index],
      messageText: preview.messageText,
    })),
  );
}

/** Opens in-app polls for shared meals. Ignores already-open or closed polls. */
export async function openPollsForMealTypes(
  spaceId: UUID,
  menuDate: string,
  mealTypes: MealType[],
): Promise<number> {
  if (mealTypes.length === 0) {
    return 0;
  }
  const results = await Promise.allSettled(
    mealTypes.map(type => mealsApi.openMealPoll(spaceId, menuDate, type)),
  );
  return results.filter(result => result.status === 'fulfilled').length;
}
