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

export type ShareBlockReason = 'missing' | 'cross-owner' | 'hidden';

function mapOptionToTarget(
  option: DailyMenuOptionResponse,
  targetCombos: MealComboResponse[],
  targetItems: FoodItemResponse[],
): { ok: true; option: MappedOption } | { ok: false; missing: string; reason: ShareBlockReason } {
  const entryType = option.entryType ?? (option.itemId ? 'ITEM' : 'COMBO');
  const label = option.label;

  if (entryType === 'COMBO') {
    if (!option.comboId) {
      return { ok: false, missing: label, reason: 'missing' };
    }
    const combo = targetCombos.find(row => row.comboId === option.comboId);
    if (combo && !combo.isActive) {
      return { ok: false, missing: label, reason: 'missing' };
    }
    if (combo && combo.enabledForSpace === false) {
      return { ok: false, missing: label, reason: 'hidden' };
    }
    return {
      ok: true,
      option: {
        entryType: 'COMBO',
        comboId: option.comboId,
        label,
        sortOrder: option.sortOrder,
        isAvailable: option.isAvailable,
      },
    };
  }

  if (entryType === 'ITEM') {
    if (!option.itemId) {
      return { ok: false, missing: label, reason: 'missing' };
    }
    const item = targetItems.find(row => row.itemId === option.itemId && row.isActive);
    if (!item) {
      return { ok: false, missing: label, reason: 'missing' };
    }
    return {
      ok: true,
      option: {
        entryType: 'ITEM',
        itemId: item.itemId,
        label,
        sortOrder: option.sortOrder,
        isAvailable: option.isAvailable,
        price: option.price ?? item.defaultPrice ?? null,
        currencyCode: option.currencyCode ?? item.currencyCode ?? 'INR',
      },
    };
  }

  const packageIds =
    option.packageItems?.map(item => item.itemId).filter((id): id is UUID => Boolean(id)) ?? [];
  if (packageIds.length === 0) {
    return { ok: false, missing: label, reason: 'missing' };
  }
  for (const itemId of packageIds) {
    const item = targetItems.find(row => row.itemId === itemId && row.isActive);
    if (!item) {
      const name = option.packageItems?.find(row => row.itemId === itemId)?.name ?? label;
      return { ok: false, missing: name, reason: 'missing' };
    }
  }
  return {
    ok: true,
    option: {
      entryType: 'PACKAGE',
      itemIds: packageIds,
      label,
      sortOrder: option.sortOrder,
      isAvailable: option.isAvailable,
      isExtra: option.isExtra,
      price: option.price ?? null,
      currencyCode: option.currencyCode ?? 'INR',
    },
  };
}

export type ShareToSpaceValidation =
  | {
      ok: true;
      optionsByMeal: Partial<Record<MealType, MappedOption[]>>;
      notesByMeal: Partial<Record<MealType, string | null>>;
      /** Extra labels left off this destination because it is not a mess. */
      skippedExtras?: string[];
      /**
       * Catalog items this mess must mark as extras before the menu is saved.
       * The source mess already treats them as extras; the destination has not.
       */
      extrasToEnable?: UUID[];
    }
  | { ok: false; spaceName: string; missingLabels: string[]; reason: ShareBlockReason };

function destinationSupportsMealExtras(space: MySpaceResponse): boolean {
  return space.spaceType === 'MESS';
}

/** Validate that the target space can use the same shared menu ids. */
export async function validateShareMenusToSpace(
  sourceMenus: Partial<Record<MealType, DailyMenuResponse>>,
  mealTypes: MealType[],
  targetSpace: MySpaceResponse,
  sourceSpace?: MySpaceResponse,
): Promise<ShareToSpaceValidation> {
  if (
    sourceSpace?.ownerId &&
    targetSpace.ownerId &&
    sourceSpace.ownerId !== targetSpace.ownerId
  ) {
    return {
      ok: false,
      spaceName: targetSpace.spaceName,
      missingLabels: [],
      reason: 'cross-owner',
    };
  }

  const [combos, items] = await Promise.all([
    mealsApi.getMealCombos(targetSpace.spaceId),
    mealsApi.getFoodItems(targetSpace.spaceId),
  ]);

  const optionsByMeal: Partial<Record<MealType, MappedOption[]>> = {};
  const notesByMeal: Partial<Record<MealType, string | null>> = {};
  const missingLabels: string[] = [];
  const skippedExtras: string[] = [];
  const extrasToEnable: UUID[] = [];
  const supportsExtras = destinationSupportsMealExtras(targetSpace);
  let reason: ShareBlockReason = 'missing';

  for (const mealType of mealTypes) {
    const source = sourceMenus[mealType];
    const options = (source?.options ?? []).filter(option => option.isAvailable);
    if (options.length === 0) {
      continue;
    }
    const mapped: MappedOption[] = [];
    for (const option of options) {
      if (option.isExtra && !supportsExtras) {
        skippedExtras.push(option.label);
        continue;
      }
      const result = mapOptionToTarget(option, combos, items);
      if (!result.ok) {
        missingLabels.push(result.missing);
        if (result.reason === 'hidden') {
          reason = 'hidden';
        }
        continue;
      }
      const packageItemIds = result.option.itemIds;
      if (
        supportsExtras &&
        result.option.entryType === 'PACKAGE' &&
        result.option.isExtra &&
        packageItemIds?.length === 1
      ) {
        const itemId = packageItemIds[0];
        const item = items.find(row => row.itemId === itemId);
        if (item && item.isExtra !== true) {
          extrasToEnable.push(itemId);
        }
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
      reason,
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
      reason: 'missing',
    };
  }

  return {
    ok: true,
    optionsByMeal,
    notesByMeal,
    skippedExtras: skippedExtras.length > 0 ? [...new Set(skippedExtras)] : undefined,
    extrasToEnable: extrasToEnable.length > 0 ? [...new Set(extrasToEnable)] : undefined,
  };
}

function validatedOptionsCount(options?: MappedOption[]): number {
  return options?.length ?? 0;
}

/** Keep the device and API from opening dozens of spaces at once. */
export const SHARE_SPACE_CONCURRENCY = 4;

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Math.max(1, Math.min(concurrency, items.length));

  async function run(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => run()));
  return results;
}

/**
 * Copy selected meal menus into a target space, publish, and open polls.
 * Meals for one space run together. Meals already opened in this attempt are skipped
 * so a retry does not publish again or rebuild an open poll.
 * Does not copy poll responses, headcount, delivery, or payments.
 */
export async function shareMenusToSpace(
  targetSpaceId: UUID,
  menuDate: string,
  mealTypes: MealType[],
  validated: Extract<ShareToSpaceValidation, { ok: true }>,
  alreadyOpen: readonly MealType[] = [],
): Promise<{ opened: MealType[]; failed: MealType[] }> {
  const open = new Set(alreadyOpen);
  const pending = mealTypes.filter(mealType => {
    const options = validated.optionsByMeal[mealType];
    return Boolean(options && options.length > 0) && !open.has(mealType);
  });

  if (pending.length > 0) {
    const extrasToEnable = [...new Set(validated.extrasToEnable ?? [])];
    await Promise.all(
      extrasToEnable.map(itemId =>
        mealsApi.updateFoodItemExtra(targetSpaceId, itemId, { isExtra: true }),
      ),
    );
  }

  await Promise.all(
    pending.map(async mealType => {
      const options = validated.optionsByMeal[mealType];
      if (!options || options.length === 0) {
        return;
      }
      await mealsApi.upsertDailyMenu(targetSpaceId, menuDate, mealType, {
        options,
        notes: validated.notesByMeal[mealType] ?? null,
      });
      await mealsApi.publishDailyMenu(targetSpaceId, menuDate, mealType);
    }),
  );

  const polls =
    pending.length === 0
      ? { opened: [] as MealType[], failed: [] as MealType[] }
      : await openPollsForMealTypes(targetSpaceId, menuDate, pending);

  return {
    opened: mealTypes.filter(mealType => open.has(mealType) || polls.opened.includes(mealType)),
    failed: polls.failed,
  };
}
