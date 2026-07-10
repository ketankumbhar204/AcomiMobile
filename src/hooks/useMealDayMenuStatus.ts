import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { DailyMenuResponse, MealType, UUID } from '../api/types';
import {
  listPlannedMealTypes,
  resolveMealOperationsEmptyKind,
  summarizeDailyMenuDay,
  type DailyMenuDaySummary,
  type MealOperationsEmptyKind,
} from '../utils/dailyMenuDayStatus';
import { fetchDailyMenusByDateCached } from '../utils/mealDayQueryCache';

type MealDayMenuStatusState = {
  loading: boolean;
  summary: DailyMenuDaySummary;
  plannedMealTypes: MealType[];
  menuMap: Partial<Record<MealType, DailyMenuResponse>>;
  emptyKind: MealOperationsEmptyKind;
  reload: () => Promise<void>;
};

export function useMealDayMenuStatus(
  spaceId: UUID,
  menuDate: string,
  enabled: boolean,
): MealDayMenuStatusState {
  const [loading, setLoading] = useState(() => enabled);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchDailyMenusByDateCached(spaceId, menuDate).catch(() => []);
      setMenus(rows);
    } finally {
      setLoading(false);
    }
  }, [enabled, menuDate, spaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }
      void reload();
      return undefined;
    }, [enabled, reload]),
  );

  const summary = useMemo(() => summarizeDailyMenuDay(menus), [menus]);
  const plannedMealTypes = useMemo(() => listPlannedMealTypes(menus), [menus]);
  const menuMap = useMemo(() => {
    const map: Partial<Record<MealType, DailyMenuResponse>> = {};
    for (const menu of menus) {
      map[menu.mealType] = menu;
    }
    return map;
  }, [menus]);
  const emptyKind = useMemo(() => resolveMealOperationsEmptyKind(summary), [summary]);

  return {
    loading,
    summary,
    plannedMealTypes,
    menuMap,
    emptyKind,
    reload,
  };
}
