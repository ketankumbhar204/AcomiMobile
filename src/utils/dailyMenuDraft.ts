import { mealsApi } from '../api/mealsApi';
import type {
  DailyMenuOptionResponse,
  DailyMenuResponse,
  MealComboResponse,
  MealType,
  UpsertDailyMenuRequest,
  UUID,
} from '../api/types';
import { formatComboIncludeLine } from './comboIncludes';

export type MenuSelectionItemPackage = {
  itemId: string;
  name: string;
  price: number | null;
  currencyCode?: string | null;
  foodType?: import('../api/types').FoodType | null;
};

export type MenuAdHocPackage = {
  label: string;
  itemIds: string[];
  price?: number | null;
  currencyCode?: string | null;
};

export type MenuDraftOption = {
  optionId?: string | null;
  entryType: 'COMBO' | 'ITEM' | 'PACKAGE';
  comboId?: string | null;
  itemId?: string | null;
  /** Only for PACKAGE entries — list of food item UUIDs */
  itemIds?: string[] | null;
  label: string;
  sortOrder: number;
  isAvailable: boolean;
  /** Mess-only add-on; independent from the same item as a main dish. */
  isExtra?: boolean;
  price?: number | null;
  currencyCode?: string | null;
  /** Client-only hint for PACKAGE rows in the planner UI */
  foodType?: import('../api/types').FoodType | null;
};

function inferEntryType(option: DailyMenuOptionResponse): 'COMBO' | 'ITEM' | 'PACKAGE' {
  if (option.entryType) return option.entryType;
  if (option.itemId) return 'ITEM';
  return 'COMBO';
}

export function toMenuDraftOption(option: DailyMenuOptionResponse, index: number): MenuDraftOption {
  const entryType = inferEntryType(option);
  const packageItemIds =
    entryType === 'PACKAGE'
      ? (option.packageItems?.map(pi => pi.itemId) ??
        (option.itemId ? [option.itemId] : null))
      : null;
  return {
    optionId: option.optionId ?? null,
    entryType,
    comboId: entryType === 'COMBO' ? option.comboId : null,
    itemId: entryType === 'ITEM' ? option.itemId : null,
    itemIds: packageItemIds,
    label: option.label,
    sortOrder: option.sortOrder ?? index + 1,
    isAvailable: option.isAvailable,
    isExtra: option.isExtra === true,
    price: option.price ?? null,
    currencyCode: option.currencyCode ?? 'INR',
  };
}

export function toUpsertOptions(options: MenuDraftOption[]): UpsertDailyMenuRequest['options'] {
  return options.map(option => ({
    optionId: option.optionId ?? undefined,
    entryType: option.entryType,
    comboId: option.entryType === 'COMBO' ? option.comboId : null,
    itemId: option.entryType === 'ITEM' ? option.itemId : null,
    itemIds: option.entryType === 'PACKAGE' ? (option.itemIds ?? []) : null,
    label: option.label,
    sortOrder: option.sortOrder,
    isAvailable: option.isAvailable,
    isExtra: option.entryType === 'PACKAGE' ? option.isExtra === true : false,
    price: option.entryType === 'PACKAGE' ? (option.price ?? null) : null,
    currencyCode: option.entryType === 'PACKAGE' ? (option.currencyCode ?? 'INR') : null,
  }));
}

export function getDraftOptionItemNames(
  option: MenuDraftOption,
  comboById: Map<string, MealComboResponse>,
): string[] {
  if (option.entryType === 'COMBO' && option.comboId) {
    return (
      comboById
        .get(option.comboId)
        ?.items?.map(item => formatComboIncludeLine(item.name, item.quantity))
        .filter(Boolean) ?? []
    );
  }
  if (option.entryType === 'PACKAGE' && option.itemIds?.length === 1) {
    return [];
  }
  return [];
}

export function getDraftOptionFoodType(
  option: MenuDraftOption,
  comboById: Map<string, MealComboResponse>,
): MealComboResponse['foodType'] | null {
  if (option.foodType) {
    return option.foodType;
  }
  if (option.entryType === 'COMBO' && option.comboId) {
    return comboById.get(option.comboId)?.foodType ?? null;
  }
  return null;
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
  const packageOptions = options.filter(option => option.entryType === 'PACKAGE');
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
    ...packageOptions.map((option, index) => ({
      ...option,
      sortOrder: comboOptions.length + index + 1,
    })),
    ...itemOptions.map((option, index) => ({
      ...option,
      sortOrder: comboOptions.length + packageOptions.length + index + 1,
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
  const packageOptions = options.filter(option => option.entryType === 'PACKAGE');
  const itemOptions: MenuDraftOption[] = items.map((item, index) => ({
    entryType: 'ITEM',
    comboId: null,
    itemId: item.itemId,
    label: item.name,
    sortOrder: comboOptions.length + packageOptions.length + index + 1,
    isAvailable: true,
  }));
  const next: MenuDraftOption[] = [
    ...comboOptions.map((option, index) => ({ ...option, sortOrder: index + 1 })),
    ...packageOptions.map((option, index) => ({
      ...option,
      sortOrder: comboOptions.length + index + 1,
    })),
    ...itemOptions,
  ];
  return saveMenuDraft(spaceId, menuDate, mealType, next, notes);
}

export function reindexMenuOptions(options: MenuDraftOption[]): MenuDraftOption[] {
  return options.map((option, index) => ({ ...option, sortOrder: index + 1 }));
}

export function mergeCombosIntoOptions(
  prev: MenuDraftOption[],
  combos: Array<{ comboId: string; name: string; price?: number | null; currencyCode?: string | null }>,
): MenuDraftOption[] {
  const packages = prev.filter(option => option.entryType === 'PACKAGE');
  const items = prev.filter(option => option.entryType === 'ITEM');
  const comboOptions: MenuDraftOption[] = combos.map(combo => ({
    entryType: 'COMBO',
    comboId: combo.comboId,
    itemId: null,
    label: combo.name,
    sortOrder: 0,
    isAvailable: true,
    price: combo.price ?? null,
    currencyCode: combo.currencyCode ?? 'INR',
  }));
  return reindexMenuOptions([...comboOptions, ...packages, ...items]);
}

export function mergeSelectionIntoOptions(
  prev: MenuDraftOption[],
  combos: Array<{ comboId: string; name: string; price?: number | null; currencyCode?: string | null }>,
  itemPackages: MenuSelectionItemPackage[],
  adHocPackages: MenuAdHocPackage[] = [],
  extraPackages: MenuSelectionItemPackage[] = [],
): MenuDraftOption[] {
  const comboOptions: MenuDraftOption[] = combos.map(combo => ({
    optionId:
      prev.find(option => option.entryType === 'COMBO' && option.comboId === combo.comboId)
        ?.optionId ?? null,
    entryType: 'COMBO',
    comboId: combo.comboId,
    itemId: null,
    label: combo.name,
    sortOrder: 0,
    isAvailable: true,
    isExtra: false,
    price: combo.price ?? null,
    currencyCode: combo.currencyCode ?? 'INR',
  }));
  const singleItemPackages: MenuDraftOption[] = itemPackages.map(item => ({
    optionId:
      prev.find(
        option =>
          option.entryType === 'PACKAGE' &&
          option.isExtra !== true &&
          option.itemIds?.length === 1 &&
          option.itemIds[0] === item.itemId,
      )?.optionId ?? null,
    entryType: 'PACKAGE',
    comboId: null,
    itemId: null,
    itemIds: [item.itemId],
    label: item.name,
    sortOrder: 0,
    isAvailable: true,
    isExtra: false,
    price: item.price,
    currencyCode: item.currencyCode ?? 'INR',
    foodType: item.foodType ?? null,
  }));
  const extraItemPackages: MenuDraftOption[] = extraPackages.map(item => ({
    optionId:
      prev.find(
        option =>
          option.entryType === 'PACKAGE' &&
          option.isExtra === true &&
          option.itemIds?.length === 1 &&
          option.itemIds[0] === item.itemId,
      )?.optionId ?? null,
    entryType: 'PACKAGE',
    comboId: null,
    itemId: null,
    itemIds: [item.itemId],
    label: item.name,
    sortOrder: 0,
    isAvailable: true,
    isExtra: true,
    price: item.price,
    currencyCode: item.currencyCode ?? 'INR',
    foodType: item.foodType ?? null,
  }));
  const multiItemPackages: MenuDraftOption[] = adHocPackages.map(pkg => ({
    optionId:
      prev.find(
        option =>
          option.entryType === 'PACKAGE' &&
          option.isExtra !== true &&
          (option.itemIds?.length ?? 0) > 1 &&
          option.label === pkg.label,
      )?.optionId ?? null,
    entryType: 'PACKAGE',
    comboId: null,
    itemId: null,
    itemIds: pkg.itemIds,
    label: pkg.label,
    sortOrder: 0,
    isAvailable: true,
    isExtra: false,
    price: pkg.price ?? null,
    currencyCode: pkg.currencyCode ?? 'INR',
  }));
  return reindexMenuOptions([
    ...comboOptions,
    ...multiItemPackages,
    ...singleItemPackages,
    ...extraItemPackages,
  ]);
}

export function mergeItemsIntoOptions(
  prev: MenuDraftOption[],
  items: Array<{ itemId: string; name: string }>,
): MenuDraftOption[] {
  const combos = prev.filter(option => option.entryType === 'COMBO');
  const packages = prev.filter(option => option.entryType === 'PACKAGE');
  const itemOptions: MenuDraftOption[] = items.map(item => ({
    entryType: 'ITEM',
    comboId: null,
    itemId: item.itemId,
    label: item.name,
    sortOrder: 0,
    isAvailable: true,
  }));
  return reindexMenuOptions([...combos, ...packages, ...itemOptions]);
}

export async function appendPackageToMenu(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType,
  name: string,
  itemIds: string[],
): Promise<DailyMenuResponse> {
  const { options, notes } = await loadMenuDraft(spaceId, menuDate, mealType);
  const next: MenuDraftOption[] = [
    ...options,
    {
      entryType: 'PACKAGE',
      comboId: null,
      itemId: null,
      itemIds,
      label: name,
      sortOrder: options.length + 1,
      isAvailable: true,
    },
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

/** Draft / chip key for a single-item PACKAGE offered as an extra. */
export function extraItemDraftId(itemId: string): string {
  return `extra:${itemId}`;
}

/** Stable key for planned-row price drafts and list keys. */
export function optionChipId(option: MenuDraftOption): string {
  if (option.entryType === 'COMBO') {
    return option.comboId ?? option.label;
  }
  if (option.entryType === 'PACKAGE' && option.itemIds?.length === 1) {
    const itemId = option.itemIds[0];
    return option.isExtra === true ? extraItemDraftId(itemId) : itemId;
  }
  if (option.entryType === 'PACKAGE') {
    return `package:${option.label}`;
  }
  return option.label;
}

export function findPlannedComboByChipId(
  options: MenuDraftOption[],
  chipId: string,
): MenuDraftOption | undefined {
  return options.find(option => optionChipId(option) === chipId);
}

export async function resolvePlannedComboItemNames(
  spaceId: UUID,
  option: MenuDraftOption,
): Promise<string[]> {
  if (option.entryType === 'PACKAGE') {
    const ids = option.itemIds ?? [];
    if (ids.length === 0) {
      return [];
    }
    const items = await mealsApi.getFoodItems(spaceId);
    const byId = new Map(items.map(item => [item.itemId, item.name]));
    return ids.map(id => byId.get(id)).filter((name): name is string => Boolean(name));
  }
  if (option.entryType === 'COMBO' && option.comboId) {
    const combos = await mealsApi.getMealCombos(spaceId);
    const combo = combos.find(row => row.comboId === option.comboId);
    return (
      combo?.items
        ?.map(item => formatComboIncludeLine(item.name, item.quantity))
        .filter(Boolean) ?? []
    );
  }
  return [];
}
