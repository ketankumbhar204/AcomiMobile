import { CommonActions } from '@react-navigation/native';
import type { MainStackParamList } from './types';
import { navigationRef } from './navigationRef';

/** Navigate to MainNavigator screens from tabs, headers, or modals. */
export function navigateMainStack<Route extends keyof MainStackParamList>(
  screen: Route,
  params: MainStackParamList[Route],
): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen,
        params,
      },
    } as never),
  );
}
