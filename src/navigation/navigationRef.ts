import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { useSpaceStore } from '../store/spaceStore';
import { findMySpaceEntry, resolveSpacePermissions } from '../utils/spacePermissions';
import type { RootStackParamList, SpaceTabParamList } from './types';
import type { SpaceBootstrapResult } from '../store/spaceStore';
import { devLog } from '../utils/devLog';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Soft-open SpaceTabs without CommonActions.reset.
 * Full resets remount native-stack + bottom-tabs and crash Fabric on Android
 * (addViewAt: child already has a parent) — especially for Mess (fewer tabs).
 */
function navigateToSpaceTabs(
  spaceId: string,
  tab?: {
    screen: keyof SpaceTabParamList;
    params?: SpaceTabParamList[keyof SpaceTabParamList];
  },
): void {
  if (!navigationRef.isReady()) {
    return;
  }

  let screen = tab?.screen;
  let params = tab?.params ?? { spaceId };

  // Never target a tab that SpaceTabNavigator did not register (Mess has no Accommodation).
  if (screen === 'Accommodation' || screen === 'Members') {
    const entry = findMySpaceEntry(useSpaceStore.getState().mySpaces, spaceId);
    const permissions = resolveSpacePermissions(entry);
    if (screen === 'Accommodation' && !permissions.canViewAccommodation) {
      screen = 'Dashboard';
      params = { spaceId };
    }
    if (screen === 'Members' && !permissions.canManageMembers) {
      screen = 'Dashboard';
      params = { spaceId };
    }
  }

  navigationRef.navigate('Main', {
    screen: 'SpaceTabs',
    params: screen
      ? {
          spaceId,
          screen,
          params,
        }
      : { spaceId },
  });
}

export function resetToCompleteProfile(): void {
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
            routes: [{ name: 'CompleteProfile' }],
          },
        },
      ],
    }),
  );
}

/** @deprecated Use resetToCompleteProfile */
export function resetToProfileCompletionGate(): void {
  resetToCompleteProfile();
}

export function resetToDashboard(spaceId: string): void {
  navigateToSpaceTabs(spaceId, {
    screen: 'Dashboard',
    params: { spaceId },
  });
}

/** Open a space and land on Pending Actions (from My Spaces attention rows). */
export function openSpaceToPendingActions(spaceId: string): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigateToSpaceTabs(spaceId, {
    screen: 'Dashboard',
    params: { spaceId },
  });

  queueMicrotask(() => {
    if (!navigationRef.isReady()) {
      return;
    }
    navigationRef.navigate('Main', {
      screen: 'DashboardPendingActions',
      params: { spaceId },
    });
  });
}

export function navigateToMembersTab(spaceId: string): void {
  navigateToSpaceTabs(spaceId, {
    screen: 'Members',
    params: { spaceId },
  });
}

export function navigateToPaymentsTab(
  spaceId: string,
  paymentsParams?: Omit<SpaceTabParamList['Payments'], 'spaceId'>,
): void {
  navigateToSpaceTabs(spaceId, {
    screen: 'Payments',
    params: { spaceId, ...paymentsParams },
  });
}

/** Clears accommodation drill-down stack and lands on the Accommodation tab. */
export function resetToAccommodationHome(spaceId: string): void {
  devLog('[navigation] resetToAccommodationHome', spaceId);
  navigateToSpaceTabs(spaceId, {
    screen: 'Accommodation',
    params: { spaceId },
  });
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
