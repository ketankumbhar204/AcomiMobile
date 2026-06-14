import { useCallback, useEffect, useMemo, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  MealComboResponse,
  UUID,
} from '../api/types';

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
      const [categoryList, itemList, comboList] = await Promise.all([
        mealsApi.getFoodCategories(spaceId),
        mealsApi.getFoodItems(spaceId),
        mealsApi.getMealCombos(spaceId),
      ]);
      setCategories(categoryList);
      setItems(itemList);
      setCombos(comboList);
    } catch {
      setLoadFailed(true);
      setCategories([]);
      setItems([]);
      setCombos([]);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

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
    if (activeCategories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }

    setSelectedCategoryId(current => {
      if (current && activeCategories.some(category => category.categoryId === current)) {
        return current;
      }
      return activeCategories[0].categoryId;
    });
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
      return [];
    }
    return items.filter(item => item.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  const stats = useMemo(
    () => ({
      categoryCount: activeCategories.length,
      itemCount: items.filter(item => item.isActive).length,
      comboCount: activeCombos.length,
    }),
    [activeCategories.length, activeCombos.length, items],
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
    stats,
    reload,
  };
}
