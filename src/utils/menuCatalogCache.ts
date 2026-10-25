import type { FoodCategoryResponse, FoodItemResponse, MealComboResponse, UUID } from '../api/types';

export type SpaceMenuCatalog = {
  categories: FoodCategoryResponse[];
  items: FoodItemResponse[];
  combos: MealComboResponse[];
};

const cache = new Map<UUID, SpaceMenuCatalog>();
const inflight = new Map<UUID, Promise<SpaceMenuCatalog>>();

export function readMenuCatalog(spaceId: UUID): SpaceMenuCatalog | undefined {
  return cache.get(spaceId);
}

export function storeMenuCatalog(spaceId: UUID, catalog: SpaceMenuCatalog): void {
  cache.set(spaceId, catalog);
}

export function readInflightMenuCatalog(spaceId: UUID): Promise<SpaceMenuCatalog> | undefined {
  return inflight.get(spaceId);
}

export function storeInflightMenuCatalog(spaceId: UUID, request: Promise<SpaceMenuCatalog>): void {
  inflight.set(spaceId, request);
}

export function dropInflightMenuCatalog(spaceId: UUID): void {
  inflight.delete(spaceId);
}

export function dropMenuCatalog(spaceId: UUID): void {
  cache.delete(spaceId);
  inflight.delete(spaceId);
}

/** Drop every space's catalog so the next open refetches the shared library. */
export function clearAllMenuCatalogs(): void {
  cache.clear();
  inflight.clear();
}
