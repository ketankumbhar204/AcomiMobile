import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToDashboard(spaceId: string): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            index: 0,
            routes: [{ name: 'SpaceTabs', params: { spaceId } }],
          },
        },
      ],
    }),
  );
}

export function resetToCreateSpace(): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            index: 0,
            routes: [{ name: 'CreateSpace' }],
          },
        },
      ],
    }),
  );
}

export function resetToMySpaces(): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            index: 0,
            routes: [{ name: 'MySpaces' }],
          },
        },
      ],
    }),
  );
}

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
