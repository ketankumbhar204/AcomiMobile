import { useCallback, useEffect, useMemo, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type { DailyMenuResponse, UUID } from '../api/types';
import {
  resolveMealOperationsEmptyKind,
  summarizeDailyMenuDay,
  type DailyMenuDaySummary,
  type MealOperationsEmptyKind,
} from '../utils/dailyMenuDayStatus';

type MealDayMenuStatusState = {
  loading: boolean;
  summary: DailyMenuDaySummary;
  emptyKind: MealOperationsEmptyKind;
  reload: () => Promise<void>;
};

export function useMealDayMenuStatus(
  spaceId: UUID,
  menuDate: string,
  enabled: boolean,
): MealDayMenuStatusState {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setMenus([]);
      return;
    }

    setLoading(true);
    try {
      const rows = await mealsApi.getDailyMenusByDate(spaceId, menuDate).catch(() => []);
      setMenus(rows);
    } finally {
      setLoading(false);
    }
  }, [enabled, menuDate, spaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const summary = useMemo(() => summarizeDailyMenuDay(menus), [menus]);
  const emptyKind = useMemo(() => resolveMealOperationsEmptyKind(summary), [summary]);

  return {
    loading,
    summary,
    emptyKind,
    reload,
  };
}
