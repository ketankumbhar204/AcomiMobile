import { useCallback, useState } from 'react';
import { mealBillingApi } from '../api/mealBillingApi';
import type { MealBillingType, UUID } from '../api/types';

export function useMealBillingType(spaceId: UUID | undefined) {
  const [billingType, setBillingType] = useState<MealBillingType>('PAY_PER_MEAL');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!spaceId) {
      return;
    }
    setLoading(true);
    try {
      const settings = await mealBillingApi.getSettings(spaceId);
      setBillingType(settings.billingType);
    } catch {
      setBillingType('PAY_PER_MEAL');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  return { billingType, loading, loadBillingType: load };
}
