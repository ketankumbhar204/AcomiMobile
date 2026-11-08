import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  MealComboResponse,
  UUID,
} from '../api/types';
import { fetchSpaceMenuCatalog, patchSpaceMenuCatalogItem } from '../utils/fetchSpaceMenuCatalog';

/**
 * Null means "All categories". A specific id is kept only while that category
 * is still active, so dismissing a filter or removing a category does not
 * jump the owner to a different group.
 */
export function resolveSelectedCategoryId(
  current: string | null,
  categoryIds: readonly string[],
): string | null {
  if (categoryIds.length === 0) {
    return null;
  }
  if (current && categoryIds.includes(current)) {
    return current;
  }
  return null;
}

export function useMenuLibrary(spaceId: UUID) {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [categories, setCategories] = useState<FoodCategoryResponse[]>([]);
  const [items, setItems] = useState<FoodItemResponse[]>([]);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const catalog = await fetchSpaceMenuCatalog(spaceId, { force: true });
      setCategories(catalog.categories);
      setItems(catalog.items);
      setCombos(catalog.combos);
    } catch {
      setLoadFailed(true);
      setCategories([]);
      setItems([]);
      setCombos([]);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  const patchItem = useCallback(
    (item: FoodItemResponse) => {
      patchSpaceMenuCatalogItem(spaceId, item);
      setItems(prev => {
        const index = prev.findIndex(row => row.itemId === item.itemId);
        if (index < 0) {
          return [...prev, item];
        }
        const next = [...prev];
        next[index] = item;
        return next;
      });
    },
    [spaceId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const activeCategories = useMemo(
    () =>
      categories
        .filter(category => category.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const activeCombos = useMemo(
    () => combos.filter(combo => combo.isActive).sort((a, b) => a.name.localeCompare(b.name)),
    [combos],
  );

  useEffect(() => {
    const categoryIds = activeCategories.map(category => category.categoryId);
    setSelectedCategoryId(current => resolveSelectedCategoryId(current, categoryIds));
  }, [activeCategories]);

  useEffect(() => {
    if (activeCombos.length === 0) {
      setSelectedComboId(null);
      return;
    }

    setSelectedComboId(current => {
      if (current && activeCombos.some(combo => combo.comboId === current)) {
        return current;
      }
      return activeCombos[0].comboId;
    });
  }, [activeCombos]);

  const selectedCategory = useMemo(
    () => activeCategories.find(category => category.categoryId === selectedCategoryId) ?? null,
    [activeCategories, selectedCategoryId],
  );

  const selectedCombo = useMemo(
    () => activeCombos.find(combo => combo.comboId === selectedComboId) ?? null,
    [activeCombos, selectedComboId],
  );

  const filteredItems = useMemo(() => {
    if (!selectedCategoryId) {
      return items;
    }
    return items.filter(item => item.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  const extraItems = useMemo(
    () => items.filter(item => item.isActive && item.isExtra === true),
    [items],
  );

  const filteredExtraItems = useMemo(() => {
    if (!selectedCategoryId) {
      return extraItems;
    }
    return extraItems.filter(item => item.categoryId === selectedCategoryId);
  }, [extraItems, selectedCategoryId]);

  const extraCategories = useMemo(() => {
    const categoryIds = new Set(extraItems.map(item => item.categoryId));
    return activeCategories.filter(category => categoryIds.has(category.categoryId));
  }, [activeCategories, extraItems]);

  const stats = useMemo(
    () => ({
      categoryCount: activeCategories.length,
      itemCount: items.filter(item => item.isActive).length,
      comboCount: activeCombos.length,
      extraCount: extraItems.length,
    }),
    [activeCategories.length, activeCombos.length, extraItems.length, items],
  );

  return {
    loading,
    loadFailed,
    categories,
    items,
    combos,
    activeCategories,
    activeCombos,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    selectedComboId,
    setSelectedComboId,
    selectedCombo,
    filteredItems,
    extraItems,
    filteredExtraItems,
    extraCategories,
    stats,
    reload,
    patchItem,
  };
}
