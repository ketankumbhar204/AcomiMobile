import { useCallback, useEffect, useRef, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type { MealHeadcountDetailResponse, MealType, UUID } from '../api/types';

/**
 * Loads headcount detail for one meal. Caches by mealType for the current
 * spaceId+menuDate so switching meals in the drawer does not refetch.
 */
export function useMealHeadcountDetail(
  spaceId: UUID,
  menuDate: string,
  mealType: MealType | null,
  enabled: boolean,
) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MealHeadcountDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Partial<Record<MealType, MealHeadcountDetailResponse>>>({});
  const cacheKeyRef = useRef(`${spaceId}:${menuDate}`);

  useEffect(() => {
    const scopeKey = `${spaceId}:${menuDate}`;
    if (cacheKeyRef.current !== scopeKey) {
      cacheKeyRef.current = scopeKey;
      cacheRef.current = {};
    }
  }, [menuDate, spaceId]);

  const load = useCallback(
    async (force = false) => {
      if (!enabled || !mealType) {
        setDetail(null);
        setError(null);
        return;
      }

      const cached = cacheRef.current[mealType];
      if (!force && cached) {
        setDetail(cached);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await mealsApi.getMealHeadcountDetail(spaceId, menuDate, mealType);
        cacheRef.current[mealType] = response;
        setDetail(response);
      } catch {
        setDetail(null);
        setError('load_failed');
      } finally {
        setLoading(false);
      }
    },
    [enabled, mealType, menuDate, spaceId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load(true), [load]);

  return { loading, detail, error, reload };
}
