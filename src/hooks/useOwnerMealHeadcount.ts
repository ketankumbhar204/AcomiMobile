import { useCallback, useEffect, useState } from 'react';
import type { MealHeadcountSlot, UUID } from '../api/types';
import { fetchMealHeadcountDayCached } from '../utils/mealDayQueryCache';
import { MEAL_TYPES } from '../utils/mealLabels';

export function useOwnerMealHeadcount(spaceId: UUID, menuDate: string, enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [slots, setSlots] = useState<MealHeadcountSlot[]>([]);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled) {
        setLoading(false);
        setReady(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }
      try {
        const day = await fetchMealHeadcountDayCached(spaceId, menuDate).catch(() => ({
          date: menuDate,
          slots: [] as MealHeadcountSlot[],
        }));
        setSlots(day.slots);
      } finally {
        setLoading(false);
        setReady(true);
      }
    },
    [enabled, menuDate, spaceId],
  );

  // useEffect (not only useFocusEffect): sheet can enable this while Dashboard is already focused.
  useEffect(() => {
    if (!enabled) {
      setSlots([]);
      setLoading(false);
      setReady(false);
      return;
    }
    setLoading(true);
    setReady(false);
    void load();
  }, [enabled, load]);

  const orderedSlots = MEAL_TYPES.map(mealType =>
    slots.find(slot => slot.mealType === mealType),
  ).filter((slot): slot is MealHeadcountSlot => slot != null);

  const openSlots = orderedSlots.filter(slot => slot.pollStatus === 'OPEN');

  const reload = useCallback(() => load(true), [load]);

  return {
    loading,
    /** True after at least one fetch completed while enabled. */
    ready,
    slots: orderedSlots,
    openSlots,
    hasOpenPolls: openSlots.length > 0,
    reload,
  };
}
