import { useCallback, useMemo } from 'react';
import type { MainStackParamList } from '../navigation/types';
import { navigateMainStack } from '../navigation/mainStackNavigation';

type NavigateMainStack = <Route extends keyof MainStackParamList>(
  screen: Route,
  params: MainStackParamList[Route],
) => void;

export function useMainStackNavigation(): { navigate: NavigateMainStack } {
  const navigate = useCallback<NavigateMainStack>((screen, params) => {
    navigateMainStack(screen, params);
  }, []);

  return useMemo(() => ({ navigate }), [navigate]);
}
