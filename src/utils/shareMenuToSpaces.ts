import { mealsApi } from '../api/mealsApi';
import type {
  DailyMenuOptionResponse,
  DailyMenuResponse,
  FoodItemResponse,
  MealComboResponse,
  MealType,
  MySpaceResponse,
  UpsertDailyMenuRequest,
  UUID,
} from '../api/types';
import { deriveMealPermissions } from './mealPermissions';
import { openPollsForMealTypes } from './shareMenuSelection';

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Spaces that can receive a shared meal plan (excludes rental / no-meals). */
export function isMealShareCompatibleSpace(space: MySpaceResponse): boolean {
  if (space.spaceType === 'RENTAL') {
    return false;
  }
  const permissions =
    space.permissions ?? deriveMealPermissions(space.membershipRole);
  return permissions.canManageMeals === true;
}

export function listOtherShareTargetSpaces(
  spaces: MySpaceResponse[],
  currentSpaceId: UUID,
): MySpaceResponse[] {
  return spaces
    .filter(space => space.spaceId !== currentSpaceId)
    .filter(isMealShareCompatibleSpace)
    .sort((a, b) => a.spaceName.localeCompare(b.spaceName));
}

type MappedOption = UpsertDailyMenuRequest['options'][number];

function mapOptionToTarget(
  option: DailyMenuOptionResponse,
  targetCombos: MealComboResponse[],
  targetItems: FoodItemResponse[],
): { ok: true; option: MappedOption } | { ok: false; missing: string } {
  const entryType = option.entryType ?? (option.itemId ? 'ITEM' : 'COMBO');
  const label = option.label;

  if (entryType === 'COMBO') {
    const combo = targetCombos.find(
      row => normalizeName(row.name) === normalizeName(label) && row.isActive,
    );
    if (!combo) {
      return { ok: false, missing: label };
    }
    return {
      ok: true,
      option: {
        entryType: 'COMBO',
        comboId: combo.comboId,
        label: combo.name,
        sortOrder: option.sortOrder,
        isAvailable: option.isAvailable,
      },
    };
  }

  if (entryType === 'ITEM') {
    const item = targetItems.find(
      row =>
        row.isActive &&
        normalizeName(row.name) === normalizeName(option.label),
    );
    if (!item) {
      return { ok: false, missing: label };
    }
    return {
      ok: true,
      option: {
        entryType: 'ITEM',
        itemId: item.itemId,
        label: item.name,
        sortOrder: option.sortOrder,
        isAvailable: option.isAvailable,
        price: option.price ?? item.defaultPrice ?? null,
        currencyCode: option.currencyCode ?? item.currencyCode ?? 'INR',
      },
    };
  }

  // PACKAGE — remap by package item names when present, else by label split.
  const packageNames =
    option.packageItems?.map(pi => pi.name) ??
    (option.label ? [option.label] : []);
  const mappedIds: UUID[] = [];
  for (const name of packageNames) {
    const item = targetItems.find(
      row => row.isActive && normalizeName(row.name) === normalizeName(name),
    );
    if (!item) {
      return { ok: false, missing: name };
    }
    mappedIds.push(item.itemId);
  }
  if (mappedIds.length === 0) {
    return { ok: false, missing: label };
  }
  return {
    ok: true,
    option: {
      entryType: 'PACKAGE',
      itemIds: mappedIds,
      label,
      sortOrder: option.sortOrder,
      isAvailable: option.isAvailable,
      price: option.price ?? null,
      currencyCode: option.currencyCode ?? 'INR',
    },
  };
}

export type ShareToSpaceValidation =
  | { ok: true; optionsByMeal: Partial<Record<MealType, MappedOption[]>>; notesByMeal: Partial<Record<MealType, string | null>> }
  | { ok: false; spaceName: string; missingLabels: string[] };

/** Validate that target space library can host the selected source menus. */
export async function validateShareMenusToSpace(
  sourceMenus: Partial<Record<MealType, DailyMenuResponse>>,
  mealTypes: MealType[],
  targetSpace: MySpaceResponse,
): Promise<ShareToSpaceValidation> {
  const [combos, items] = await Promise.all([
    mealsApi.getMealCombos(targetSpace.spaceId).catch(() => [] as MealComboResponse[]),
    mealsApi.getFoodItems(targetSpace.spaceId).catch(() => [] as FoodItemResponse[]),
  ]);

  const optionsByMeal: Partial<Record<MealType, MappedOption[]>> = {};
  const notesByMeal: Partial<Record<MealType, string | null>> = {};
  const missingLabels: string[] = [];

  for (const mealType of mealTypes) {
    const source = sourceMenus[mealType];
    const options = (source?.options ?? []).filter(option => option.isAvailable);
    if (options.length === 0) {
      continue;
    }
    const mapped: MappedOption[] = [];
    for (const option of options) {
      const result = mapOptionToTarget(option, combos, items);
      if (!result.ok) {
        missingLabels.push(result.missing);
        continue;
      }
      mapped.push(result.option);
    }
    if (mapped.length > 0) {
      optionsByMeal[mealType] = mapped;
      notesByMeal[mealType] = source?.notes ?? null;
    }
  }

  if (missingLabels.length > 0) {
    return {
      ok: false,
      spaceName: targetSpace.spaceName,
      missingLabels: [...new Set(missingLabels)],
    };
  }

  const hasAnyMapped = mealTypes.some(
    mealType => (validatedOptionsCount(optionsByMeal[mealType]) ?? 0) > 0,
  );
  if (!hasAnyMapped) {
    return {
      ok: false,
      spaceName: targetSpace.spaceName,
      missingLabels: mealTypes.map(String),
    };
  }

  return { ok: true, optionsByMeal, notesByMeal };
}

function validatedOptionsCount(options?: MappedOption[]): number {
  return options?.length ?? 0;
}

/**
 * Copy selected meal menus into a target space, publish, and open polls.
 * Does not copy poll responses, headcount, delivery, or payments.
 */
export async function shareMenusToSpace(
  targetSpaceId: UUID,
  menuDate: string,
  mealTypes: MealType[],
  validated: Extract<ShareToSpaceValidation, { ok: true }>,
): Promise<number> {
  const appliedTypes: MealType[] = [];
  for (const mealType of mealTypes) {
    const options = validated.optionsByMeal[mealType];
    if (!options || options.length === 0) {
      continue;
    }
    await mealsApi.upsertDailyMenu(targetSpaceId, menuDate, mealType, {
      options,
      notes: validated.notesByMeal[mealType] ?? null,
    });
    await mealsApi.publishDailyMenu(targetSpaceId, menuDate, mealType);
    appliedTypes.push(mealType);
  }
  return openPollsForMealTypes(targetSpaceId, menuDate, appliedTypes);
}
