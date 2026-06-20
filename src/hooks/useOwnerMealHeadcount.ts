import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { mealsApi } from '../api/mealsApi';
import type { MealHeadcountSlot, UUID } from '../api/types';
import { MEAL_TYPES } from '../utils/mealLabels';

export function useOwnerMealHeadcount(spaceId: UUID, menuDate: string, enabled: boolean) {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<MealHeadcountSlot[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    try {
      const day = await mealsApi.getMealHeadcountDay(spaceId, menuDate).catch(() => ({
        date: menuDate,
        slots: [],
      }));
      setSlots(day.slots);
    } finally {
      setLoading(false);
    }
  }, [enabled, menuDate, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const orderedSlots = MEAL_TYPES.map(mealType =>
    slots.find(slot => slot.mealType === mealType),
  ).filter((slot): slot is MealHeadcountSlot => slot != null);

  const openSlots = orderedSlots.filter(slot => slot.pollStatus === 'OPEN');

  const reload = useCallback(() => load(true), [load]);

  return {
    loading,
    slots: orderedSlots,
    openSlots,
    hasOpenPolls: openSlots.length > 0,
    reload,
  };
}
