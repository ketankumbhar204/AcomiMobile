import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type {
  DailyMenuResponse,
  MealHeadcountSlot,
  MealPollSlot,
  MealType,
  UUID,
} from '../api/types';
import {
  listPlannedMealTypes,
  resolveMealOperationsEmptyKind,
  summarizeDailyMenuDay,
  type DailyMenuDaySummary,
  type MealOperationsEmptyKind,
} from '../utils/dailyMenuDayStatus';
import { fetchDashboardMealDayBundle } from '../utils/mealDayQueryCache';
import { MEAL_TYPES } from '../utils/mealLabels';

export type DashboardMealDayState = {
  loading: boolean;
  summary: DailyMenuDaySummary;
  plannedMealTypes: MealType[];
  menuMap: Partial<Record<MealType, DailyMenuResponse>>;
  pollMap: Partial<Record<MealType, MealPollSlot>>;
  /** Prefetched headcount slots for opening the drawer without a blank race. */
  headcountSlots: MealHeadcountSlot[];
  /** Per-meal eligible active members (from eligibility API). */
  eligibleByMeal: Partial<Record<MealType, number>>;
  /** Per-meal plates to prepare (from headcount day API). */
  platesByMeal: Partial<Record<MealType, number>>;
  emptyKind: MealOperationsEmptyKind;
  eligibleCount: number;
  respondedCount: number;
  hasOpenPolls: boolean;
  reload: () => Promise<void>;
};

/**
 * Single load for dashboard meal ops (menus + polls + eligibility + headcount).
 * Reloads when `enabled` flips true (deferred mount) and on screen focus.
 */
export function useDashboardMealDay(
  spaceId: UUID,
  menuDate: string,
  enabled: boolean,
): DashboardMealDayState {
  const [loading, setLoading] = useState(() => enabled);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [eligibleByMeal, setEligibleByMeal] = useState<Partial<Record<MealType, number>>>({});
  const [platesByMeal, setPlatesByMeal] = useState<Partial<Record<MealType, number>>>({});
  const [headcountSlots, setHeadcountSlots] = useState<MealHeadcountSlot[]>([]);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const bundle = await fetchDashboardMealDayBundle(spaceId, menuDate);
      setMenus(bundle.menus);
      setPolls(bundle.polls.polls);

      const nextEligibleByMeal: Partial<Record<MealType, number>> = {};
      for (const slot of bundle.eligibility?.slots ?? []) {
        nextEligibleByMeal[slot.mealType] = slot.eligibleCount;
      }
      setEligibleByMeal(nextEligibleByMeal);
      setEligibleCount(
        bundle.eligibility?.distinctEligibleMemberCount ??
          bundle.eligibility?.slots.reduce(
            (max, slot) => Math.max(max, slot.eligibleCount),
            0,
          ) ??
          0,
      );

      const slots = bundle.headcount?.slots ?? [];
      setHeadcountSlots(slots);
      const nextPlates: Partial<Record<MealType, number>> = {};
      for (const slot of slots) {
        nextPlates[slot.mealType] = slot.mealsToPrepare;
      }
      setPlatesByMeal(nextPlates);
    } catch (error) {
      console.warn('[useDashboardMealDay] load failed', error);
      setMenus([]);
      setPolls([]);
      setEligibleCount(0);
      setEligibleByMeal({});
      setPlatesByMeal({});
      setHeadcountSlots([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, menuDate, spaceId]);

  // Critical: Dashboard defers `enabled` ~400ms after mount. useFocusEffect alone
  // does not re-run when enabled flips while the screen is already focused.
  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }
      void load();
      return undefined;
    }, [enabled, load]),
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
  const pollMap = useMemo(() => {
    const map: Partial<Record<MealType, MealPollSlot>> = {};
    for (const poll of polls) {
      map[poll.mealType] = poll;
    }
    return map;
  }, [polls]);
  const emptyKind = useMemo(() => resolveMealOperationsEmptyKind(summary), [summary]);

  const openPolls = useMemo(
    () =>
      MEAL_TYPES.map(mealType => pollMap[mealType]).filter(
        (poll): poll is MealPollSlot => poll != null && poll.status === 'OPEN',
      ),
    [pollMap],
  );

  const respondedCount = useMemo(() => {
    if (openPolls.length === 0) {
      return 0;
    }
    return Math.max(...openPolls.map(poll => poll.responseCount));
  }, [openPolls]);

  return {
    loading,
    summary,
    plannedMealTypes,
    menuMap,
    pollMap,
    headcountSlots,
    eligibleByMeal,
    platesByMeal,
    emptyKind,
    eligibleCount,
    respondedCount,
    hasOpenPolls: openPolls.length > 0,
    reload: load,
  };
}
