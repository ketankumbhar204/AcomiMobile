import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToLogin(): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Auth',
          state: {
            index: 0,
            routes: [{ name: 'Login' }],
          },
        },
      ],
    }),
  );
}
