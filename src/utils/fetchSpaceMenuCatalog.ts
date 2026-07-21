import { mealsApi } from '../api/mealsApi';
import { ApiError } from '../api/types';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  MealComboResponse,
  UUID,
} from '../api/types';

export type SpaceMenuCatalog = {
  categories: FoodCategoryResponse[];
  items: FoodItemResponse[];
  combos: MealComboResponse[];
};

const inflight = new Map<string, Promise<SpaceMenuCatalog>>();
const cache = new Map<string, SpaceMenuCatalog>();

async function withNetworkRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const isNetwork =
      error instanceof ApiError
        ? error.isNetworkError
        : error instanceof Error && /network/i.test(error.message);
    if (!isNetwork) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 400));
    return run();
  }
}

/**
 * Loads food categories → items → combos for a space.
 *
 * Backend lazy-seeds the catalog on first category/combo access. Parallel
 * Promise.all of these three GETs can race that seed and surface as Axios
 * "Network Error" on Android. Sequential load + in-flight dedupe avoids that
 * without changing API contracts.
 */
export async function fetchSpaceMenuCatalog(
  spaceId: UUID,
  options?: { force?: boolean },
): Promise<SpaceMenuCatalog> {
  if (!options?.force) {
    const cached = cache.get(spaceId);
    if (cached) {
      return cached;
    }
  }

  const existing = inflight.get(spaceId);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const categories = await withNetworkRetry(() => mealsApi.getFoodCategories(spaceId));
    const items = await withNetworkRetry(() => mealsApi.getFoodItems(spaceId));
    const combos = await withNetworkRetry(() => mealsApi.getMealCombos(spaceId));
    const catalog = { categories, items, combos };
    cache.set(spaceId, catalog);
    return catalog;
  })().finally(() => {
    inflight.delete(spaceId);
  });

  inflight.set(spaceId, request);
  return request;
}

export function invalidateSpaceMenuCatalog(spaceId: UUID): void {
  cache.delete(spaceId);
  inflight.delete(spaceId);
}

/** Patch one food item in the in-memory catalog cache without a full reload. */
export function patchSpaceMenuCatalogItem(spaceId: UUID, item: FoodItemResponse): void {
  const cached = cache.get(spaceId);
  if (!cached) {
    return;
  }
  const index = cached.items.findIndex(row => row.itemId === item.itemId);
  const items =
    index >= 0
      ? cached.items.map(row => (row.itemId === item.itemId ? item : row))
      : [...cached.items, item];
  cache.set(spaceId, { ...cached, items });
}
