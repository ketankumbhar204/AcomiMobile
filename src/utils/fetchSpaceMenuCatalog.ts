import { mealsApi } from '../api/mealsApi';
import { ApiError } from '../api/types';
import type {
  FoodItemResponse,
  UUID,
} from '../api/types';
import {
  clearAllMenuCatalogs,
  dropInflightMenuCatalog,
  dropMenuCatalog,
  readInflightMenuCatalog,
  readMenuCatalog,
  storeInflightMenuCatalog,
  storeMenuCatalog,
  type SpaceMenuCatalog,
} from './menuCatalogCache';

export type { SpaceMenuCatalog } from './menuCatalogCache';

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
  const force = options?.force === true;

  if (!force) {
    const cached = readMenuCatalog(spaceId);
    if (cached) {
      return cached;
    }
    const existing = readInflightMenuCatalog(spaceId);
    if (existing) {
      return existing;
    }
  } else {
    // Force must not join a concurrent non-force load — that request can race
    // backend lazy-seed and cache an empty catalog, which then keeps MEAL_OPS locked
    // even after Menu Library shows seeded defaults.
    dropMenuCatalog(spaceId);
  }

  const request = (async () => {
    const categories = await withNetworkRetry(() => mealsApi.getFoodCategories(spaceId));
    const items = await withNetworkRetry(() => mealsApi.getFoodItems(spaceId));
    const combos = await withNetworkRetry(() => mealsApi.getMealCombos(spaceId));
    const catalog = { categories, items, combos };
    storeMenuCatalog(spaceId, catalog);
    return catalog;
  })().finally(() => {
    dropInflightMenuCatalog(spaceId);
  });

  storeInflightMenuCatalog(spaceId, request);
  return request;
}

export function invalidateSpaceMenuCatalog(spaceId: UUID): void {
  dropMenuCatalog(spaceId);
}

export { clearAllMenuCatalogs };

/** Patch one food item in the in-memory catalog cache without a full reload. */
export function patchSpaceMenuCatalogItem(spaceId: UUID, item: FoodItemResponse): void {
  const cached = readMenuCatalog(spaceId);
  if (!cached) {
    return;
  }
  const index = cached.items.findIndex(row => row.itemId === item.itemId);
  const items =
    index >= 0
      ? cached.items.map(row => (row.itemId === item.itemId ? item : row))
      : [...cached.items, item];
  storeMenuCatalog(spaceId, { ...cached, items });
}
