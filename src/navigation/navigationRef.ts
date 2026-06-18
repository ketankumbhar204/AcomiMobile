import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParamList } from './types';
import type { SpaceBootstrapResult } from '../store/spaceStore';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function buildSpaceTabsState(spaceId: string, initialTab: string) {
  const routes = [
    { name: 'Dashboard' as const, params: { spaceId } },
    { name: 'Members' as const, params: { spaceId } },
    { name: 'Accommodation' as const, params: { spaceId } },
    { name: 'Meals' as const, params: { spaceId } },
    { name: 'Payments' as const, params: { spaceId } },
    { name: 'Complaints' as const, params: { spaceId } },
  ];
  const tabIndex = Math.max(
    routes.findIndex(route => route.name === initialTab),
    0,
  );
  return { index: tabIndex, routes };
}

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
            routes: [
              {
                name: 'SpaceTabs',
                params: { spaceId },
                state: buildSpaceTabsState(spaceId, 'Dashboard'),
              },
            ],
          },
        },
      ],
    }),
  );
}

export function navigateToMembersTab(spaceId: string): void {
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
            routes: [
              {
                name: 'SpaceTabs',
                params: { spaceId },
                state: buildSpaceTabsState(spaceId, 'Members'),
              },
            ],
          },
        },
      ],
    }),
  );
}

/** Clears accommodation drill-down stack and lands on the Accommodation tab. */
export function resetToAccommodationHome(spaceId: string): void {
  if (!navigationRef.isReady()) {
    return;
  }

  console.log('[navigation] resetToAccommodationHome', spaceId);

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            index: 0,
            routes: [
              {
                name: 'SpaceTabs',
                params: { spaceId },
                state: buildSpaceTabsState(spaceId, 'Accommodation'),
              },
            ],
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

export function resetToAcceptInvitations(): void {
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
            routes: [{ name: 'AcceptInvitations' }],
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

export function resetToOnboardingChoice(): void {
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
            routes: [{ name: 'OnboardingChoice' }],
          },
        },
      ],
    }),
  );
}

export function resetToJoinSpace(): void {
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
            routes: [{ name: 'JoinSpace' }],
          },
        },
      ],
    }),
  );
}

export function navigateBootstrapResult(result: SpaceBootstrapResult): void {
  if (!navigationRef.isReady()) {
    return;
  }

  switch (result.route) {
    case 'SpaceTabs':
      if (result.spaceId) {
        resetToDashboard(result.spaceId);
      }
      break;
    case 'AcceptInvitations':
      resetToAcceptInvitations();
      break;
    case 'OnboardingChoice':
      resetToOnboardingChoice();
      break;
    case 'JoinSpace':
      resetToJoinSpace();
      break;
    case 'CreateSpace':
      resetToCreateSpace();
      break;
    case 'MySpaces':
    default:
      resetToMySpaces();
      break;
  }
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
