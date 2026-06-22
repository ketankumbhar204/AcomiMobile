import type { FoodCategoryResponse, FoodItemResponse } from '../api/types';

export function filterMenuLibraryItems(
  items: FoodItemResponse[],
  options: {
    search: string;
    categoryIds: Set<string>;
  },
): FoodItemResponse[] {
  const q = options.search.trim().toLowerCase();

  return items
    .filter(item => item.isActive)
    .filter(item => {
      if (options.categoryIds.size === 0) {
        return true;
      }
      return options.categoryIds.has(item.categoryId);
    })
    .filter(item => {
      if (!q) {
        return true;
      }
      return item.name.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function countMenuLibraryFilters(categoryIds: Set<string>, totalCategories: number): number {
  if (categoryIds.size === 0 || categoryIds.size >= totalCategories) {
    return 0;
  }
  return 1;
}

export function resolveAddItemCategoryId(
  categoryIds: Set<string>,
  activeCategories: FoodCategoryResponse[],
): string | null {
  if (categoryIds.size === 1) {
    return [...categoryIds][0];
  }
  if (categoryIds.size === 0 && activeCategories.length === 1) {
    return activeCategories[0].categoryId;
  }
  return null;
}

export function categoryNameForItems(
  categoryIds: Set<string>,
  activeCategories: FoodCategoryResponse[],
  t: (key: string, options?: Record<string, unknown>) => string,
): string | undefined {
  if (categoryIds.size === 1) {
    return activeCategories.find(category => category.categoryId === [...categoryIds][0])?.name;
  }
  if (categoryIds.size === 0) {
    return t('meals.library.filterDrawer.allCategories');
  }
  return t('meals.library.filterDrawer.multipleCategories', { count: categoryIds.size });
}
