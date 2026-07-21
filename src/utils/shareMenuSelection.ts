import { mealsApi } from '../api/mealsApi';
import type {
  DailyMenuOptionResponse,
  DailyMenuResponse,
  MealComboResponse,
  MealType,
  UUID,
} from '../api/types';
import { invalidateDashboardQueries } from './dashboardQueryCache';
import { getMenuOptionItemNames } from './plannedComboDisplay';
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
  if (!hasItems) {
    return 'empty';
  }
  if (menu.status === 'PUBLISHED' || menu.status === 'DRAFT' || menu.status === 'MODIFIED') {
    return 'shareable';
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
  /** Already-shared (PUBLISHED) meals stay unchecked — user selects them explicitly. */
  const shouldPreselect = (type: MealType): boolean => {
    const menu = menuMap[type];
    if (getSlotShareState(menu) !== 'shareable') {
      return false;
    }
    return menu?.status === 'DRAFT' || menu?.status === 'MODIFIED';
  };

  if (initialMealType) {
    return shouldPreselect(initialMealType) ? [initialMealType] : [];
  }
  return MEAL_TYPES.filter(shouldPreselect);
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

export async function publishDraftMenusForTypes(
  spaceId: UUID,
  menuDate: string,
  mealTypes: MealType[],
  menuMap: Partial<Record<MealType, DailyMenuResponse>>,
): Promise<void> {
  const drafts = mealTypes.filter(type => {
    const menu = menuMap[type];
    return (
      (menu?.status === 'DRAFT' || menu?.status === 'MODIFIED') &&
      hasAvailableMenuOptions(menu)
    );
  });
  if (drafts.length === 0) {
    return;
  }
  await Promise.all(
    drafts.map(type => mealsApi.publishDailyMenu(spaceId, menuDate, type)),
  );
  invalidateDashboardQueries();
}

function isNotPublishedStub(messageText: string): boolean {
  return /\(not published\)/i.test(messageText);
}

function formatSharePrice(price?: number | null, currencyCode?: string | null): string | null {
  if (price == null || Number.isNaN(Number(price))) {
    return null;
  }
  const amount = Number(price)
    .toFixed(2)
    .replace(/\.?0+$/, '');
  const code = currencyCode?.trim() || 'INR';
  if (code.toUpperCase() === 'INR') {
    return `₹${amount}`;
  }
  return `${code} ${amount}`;
}

function inferShareEntryType(
  option: DailyMenuOptionResponse,
): 'COMBO' | 'ITEM' | 'PACKAGE' {
  if (option.entryType === 'COMBO' || option.entryType === 'ITEM' || option.entryType === 'PACKAGE') {
    return option.entryType;
  }
  if (option.comboId) {
    return 'COMBO';
  }
  if (option.itemId) {
    return 'ITEM';
  }
  return 'PACKAGE';
}

/** Numbered options block matching backend MealSharePreviewService formatting. */
export function buildShareOptionsBody(
  mealType: MealType,
  menu: DailyMenuResponse,
  comboById: Map<string, MealComboResponse> = new Map(),
): string {
  const available = [...(menu.options ?? [])]
    .filter(option => option.isAvailable)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const lines: string[] = [];
  let optionNum = 1;
  for (const option of available) {
    const entryType = inferShareEntryType(option);
    const combo = option.comboId ? comboById.get(option.comboId) : undefined;
    const price =
      entryType === 'COMBO'
        ? (option.price ?? combo?.price ?? null)
        : (option.price ?? null);
    const currencyCode =
      entryType === 'COMBO'
        ? (option.currencyCode ?? combo?.currencyCode ?? null)
        : (option.currencyCode ?? null);
    const priced = formatSharePrice(price, currencyCode);
    lines.push(`${optionNum}. ${option.label}${priced ? ` - ${priced}` : ''}`);

    if (entryType === 'COMBO' || entryType === 'PACKAGE') {
      const detailNames = getMenuOptionItemNames(option, comboById);
      if (detailNames.length > 0) {
        lines.push(detailNames.join(', '));
      }
    }
    optionNum += 1;
  }
  lines.push(`${optionNum}. Not available for ${formatMealTypeLabel(mealType)}`);
  if (menu.notes?.trim()) {
    lines.push(`Note: ${menu.notes.trim()}`);
  }
  return lines.join('\n');
}

function enrichUnpublishedPreviewMessage(
  mealType: MealType,
  menu: DailyMenuResponse,
  apiMessageText: string,
  comboById: Map<string, MealComboResponse>,
): string {
  const body = buildShareOptionsBody(mealType, menu, comboById);
  if (isNotPublishedStub(apiMessageText)) {
    return apiMessageText.replace(/\(not published\)/i, body);
  }
  return apiMessageText;
}

export async function buildShareMessageForSelection(
  spaceId: UUID,
  menuDate: string,
  mealTypes: MealType[],
  menuMapInput?: Partial<Record<MealType, DailyMenuResponse>>,
): Promise<string> {
  if (mealTypes.length === 0) {
    return '';
  }
  // Preview must not publish — publishing is reserved for the Share action.
  // Backend share-preview only lists PUBLISHED/MODIFIED slots; drafts come back as
  // "(not published)". Fill those from local daily-menu options so confirmation
  // still shows selected combos/items.
  const menuMap =
    menuMapInput ??
    menusByMealType(await mealsApi.getDailyMenusByDate(spaceId, menuDate));

  const needsComboCatalog = mealTypes.some(type => {
    const menu = menuMap[type];
    if (!menu || !hasAvailableMenuOptions(menu)) {
      return false;
    }
    return menu.options.some(
      option =>
        option.isAvailable &&
        inferShareEntryType(option) === 'COMBO' &&
        option.comboId &&
        !(option.packageItems?.length),
    );
  });

  let comboById = new Map<string, MealComboResponse>();
  if (needsComboCatalog) {
    const combos = await mealsApi.getMealCombos(spaceId).catch(() => []);
    comboById = new Map(combos.map(combo => [combo.comboId, combo]));
  }

  const previews = await Promise.all(
    mealTypes.map(type => mealsApi.getSharePreview(spaceId, menuDate, type)),
  );

  return composeShareMessages(
    previews.map((preview, index) => {
      const mealType = mealTypes[index];
      const menu = menuMap[mealType];
      let messageText = preview.messageText;
      if (
        menu &&
        hasAvailableMenuOptions(menu) &&
        isNotPublishedStub(messageText)
      ) {
        messageText = enrichUnpublishedPreviewMessage(
          mealType,
          menu,
          messageText,
          comboById,
        );
      }
      return { mealType, messageText };
    }),
  );
}

/** Opens in-app polls for shared meals. Reopens closed polls; extends past deadlines. */
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
