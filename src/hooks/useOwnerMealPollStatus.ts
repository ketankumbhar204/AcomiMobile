import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { mealsApi } from '../api/mealsApi';
import type { MealPollSlot, MealType, UUID } from '../api/types';
import {
  fetchEligibilitySummaryCached,
  fetchMealPollsCached,
} from '../utils/mealDayQueryCache';
import { MEAL_TYPES } from '../utils/mealLabels';

export function useOwnerMealPollStatus(spaceId: UUID, menuDate: string, enabled: boolean) {
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [closing, setClosing] = useState(false);

  const openPolls = useMemo(() => {
    const open = polls.filter(poll => poll.status === 'OPEN');
    return MEAL_TYPES.map(mealType => open.find(poll => poll.mealType === mealType)).filter(
      (poll): poll is MealPollSlot => poll != null,
    );
  }, [polls]);

  const pollMap = useMemo(() => {
    const map: Partial<Record<MealType, MealPollSlot>> = {};
    for (const poll of polls) {
      map[poll.mealType] = poll;
    }
    return map;
  }, [polls]);

  const respondedCount = useMemo(() => {
    if (openPolls.length === 0) {
      return 0;
    }
    return Math.max(...openPolls.map(poll => poll.responseCount));
  }, [openPolls]);

  const pendingCount = Math.max(0, eligibleCount - respondedCount);
  const allResponded = eligibleCount > 0 && respondedCount >= eligibleCount;
  const hasOpenPolls = openPolls.length > 0;

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [pollDay, eligibility] = await Promise.all([
        fetchMealPollsCached(spaceId, menuDate).catch(() => ({
          pollDate: menuDate,
          polls: [] as MealPollSlot[],
        })),
        fetchEligibilitySummaryCached(spaceId, menuDate).catch(() => null),
      ]);
      setPolls(pollDay.polls);
      setEligibleCount(
        eligibility?.distinctEligibleMemberCount ??
          eligibility?.slots.reduce((max, slot) => Math.max(max, slot.eligibleCount), 0) ??
          0,
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, menuDate, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const closeAllPolls = useCallback(async () => {
    if (openPolls.length === 0) {
      return;
    }

    setClosing(true);
    try {
      await Promise.all(
        openPolls.map(poll => mealsApi.closeMealPoll(spaceId, menuDate, poll.mealType)),
      );
      await load();
    } finally {
      setClosing(false);
    }
  }, [load, menuDate, openPolls, spaceId]);

  return {
    loading,
    openPolls,
    pollMap,
    eligibleCount,
    respondedCount,
    pendingCount,
    allResponded,
    hasOpenPolls,
    closing,
    reload: load,
    closeAllPolls,
  };
}
