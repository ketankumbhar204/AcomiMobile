import { mealsApi } from '../api/mealsApi';
import type {
  DailyMenuOptionResponse,
  DailyMenuResponse,
  MealComboResponse,
  MealType,
  UpsertDailyMenuRequest,
  UUID,
} from '../api/types';

export type MenuDraftOption = {
  entryType: 'COMBO' | 'ITEM';
  comboId?: string | null;
  itemId?: string | null;
  label: string;
  sortOrder: number;
  isAvailable: boolean;
};

function inferEntryType(option: DailyMenuOptionResponse): 'COMBO' | 'ITEM' {
  if (option.entryType) {
    return option.entryType;
  }
  if (option.itemId) {
    return 'ITEM';
  }
  return 'COMBO';
}

export function toMenuDraftOption(option: DailyMenuOptionResponse, index: number): MenuDraftOption {
  const entryType = inferEntryType(option);
  return {
    entryType,
    comboId: entryType === 'COMBO' ? option.comboId : null,
    itemId: entryType === 'ITEM' ? option.itemId : null,
    label: option.label,
    sortOrder: option.sortOrder ?? index + 1,
    isAvailable: option.isAvailable,
  };
}

export function toUpsertOptions(options: MenuDraftOption[]): UpsertDailyMenuRequest['options'] {
  return options.map(option => ({
    entryType: option.entryType,
    comboId: option.entryType === 'COMBO' ? option.comboId : null,
    itemId: option.entryType === 'ITEM' ? option.itemId : null,
    label: option.label,
    sortOrder: option.sortOrder,
    isAvailable: option.isAvailable,
  }));
}

export async function loadMenuDraft(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
): Promise<{ menu: DailyMenuResponse | null; options: MenuDraftOption[]; notes: string }> {
  const menu = await mealsApi.getDailyMenu(spaceId, menuDate, mealType).catch(() => null);
  return {
    menu,
    options: menu?.options.map(toMenuDraftOption) ?? [],
    notes: menu?.notes ?? '',
  };
}

export async function saveMenuDraft(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
  options: MenuDraftOption[],
  notes?: string | null,
): Promise<DailyMenuResponse> {
  return mealsApi.upsertDailyMenu(spaceId, menuDate, mealType, {
    options: toUpsertOptions(options),
    notes: notes ?? null,
  });
}

export async function appendComboToMenu(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
  combo: MealComboResponse,
): Promise<DailyMenuResponse> {
  const { options, notes } = await loadMenuDraft(spaceId, menuDate, mealType);
  if (options.some(option => option.entryType === 'COMBO' && option.comboId === combo.comboId)) {
    return saveMenuDraft(spaceId, menuDate, mealType, options, notes);
  }
  const next: MenuDraftOption[] = [
    ...options,
    {
      entryType: 'COMBO',
      comboId: combo.comboId,
      itemId: null,
      label: combo.name,
      sortOrder: options.length + 1,
      isAvailable: true,
    },
  ];
  return saveMenuDraft(spaceId, menuDate, mealType, next, notes);
}

export async function appendItemsToMenu(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
  items: Array<{ itemId: UUID; name: string }>,
): Promise<DailyMenuResponse> {
  const { options, notes } = await loadMenuDraft(spaceId, menuDate, mealType);
  const existingItemIds = new Set(
    options.filter(option => option.entryType === 'ITEM').map(option => option.itemId),
  );
  const toAdd = items.filter(item => !existingItemIds.has(item.itemId));
  const next: MenuDraftOption[] = [
    ...options,
    ...toAdd.map((item, index) => ({
      entryType: 'ITEM' as const,
      comboId: null,
      itemId: item.itemId,
      label: item.name,
      sortOrder: options.length + index + 1,
      isAvailable: true,
    })),
  ];
  return saveMenuDraft(spaceId, menuDate, mealType, next, notes);
}

export async function syncCombosOnMenu(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
  combos: Array<{ comboId: UUID; name: string }>,
): Promise<DailyMenuResponse> {
  const { options, notes } = await loadMenuDraft(spaceId, menuDate, mealType);
  const itemOptions = options.filter(option => option.entryType === 'ITEM');
  const comboOptions: MenuDraftOption[] = combos.map((combo, index) => ({
    entryType: 'COMBO',
    comboId: combo.comboId,
    itemId: null,
    label: combo.name,
    sortOrder: index + 1,
    isAvailable: true,
  }));
  const next: MenuDraftOption[] = [
    ...comboOptions,
    ...itemOptions.map((option, index) => ({
      ...option,
      sortOrder: comboOptions.length + index + 1,
    })),
  ];
  return saveMenuDraft(spaceId, menuDate, mealType, next, notes);
}

export async function syncItemsOnMenu(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
  items: Array<{ itemId: UUID; name: string }>,
): Promise<DailyMenuResponse> {
  const { options, notes } = await loadMenuDraft(spaceId, menuDate, mealType);
  const comboOptions = options.filter(option => option.entryType === 'COMBO');
  const itemOptions: MenuDraftOption[] = items.map((item, index) => ({
    entryType: 'ITEM',
    comboId: null,
    itemId: item.itemId,
    label: item.name,
    sortOrder: comboOptions.length + index + 1,
    isAvailable: true,
  }));
  const next: MenuDraftOption[] = [
    ...comboOptions.map((option, index) => ({ ...option, sortOrder: index + 1 })),
    ...itemOptions,
  ];
  return saveMenuDraft(spaceId, menuDate, mealType, next, notes);
}

export async function appendComboAndItemsToMenu(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
  combo: MealComboResponse,
): Promise<DailyMenuResponse> {
  const { options, notes } = await loadMenuDraft(spaceId, menuDate, mealType);
  const hasCombo = options.some(
    option => option.entryType === 'COMBO' && option.comboId === combo.comboId,
  );
  const next = hasCombo
    ? options
    : [
        ...options,
        {
          entryType: 'COMBO' as const,
          comboId: combo.comboId,
          itemId: null,
          label: combo.name,
          sortOrder: options.length + 1,
          isAvailable: true,
        },
      ];
  return saveMenuDraft(spaceId, menuDate, mealType, next, notes);
}
