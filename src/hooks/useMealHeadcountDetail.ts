import { useCallback, useEffect, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type { MealHeadcountDetailResponse, MealType, UUID } from '../api/types';

export function useMealHeadcountDetail(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType | null,
  enabled: boolean,
) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MealHeadcountDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !mealType) {
      setDetail(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await mealsApi.getMealHeadcountDetail(spaceId, menuDate, mealType);
      setDetail(response);
    } catch {
      setDetail(null);
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, [enabled, mealType, menuDate, spaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, detail, error, reload: load };
}
