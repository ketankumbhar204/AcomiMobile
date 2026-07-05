import { useCallback } from 'react';
import { navigateMainStack } from '../navigation/mainStackNavigation';
import type { MainStackParamList } from '../navigation/types';

/** Navigate to Main stack screens from a Space tab (Dashboard, Members, etc.). */
export function useNavigateFromSpaceTab() {
  return useCallback(
    <Route extends keyof MainStackParamList>(
      screen: Route,
      params: MainStackParamList[Route],
    ) => {
      navigateMainStack(screen, params);
    },
    [],
  );
}
