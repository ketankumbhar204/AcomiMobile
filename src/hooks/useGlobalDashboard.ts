import { useCallback, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import type { GlobalDashboardResponse } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';

export function useGlobalDashboard(enabled: boolean) {
  const [data, setData] = useState<GlobalDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reload = useCallback(
    async (sync = true) => {
      if (!enabled) {
        setData(null);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const response = await dashboardApi.getGlobalDashboard(currentMonthKey(), sync);
        setData(response);
      } catch {
        setError(true);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  return { data, loading, error, reload };
}
