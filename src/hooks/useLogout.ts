import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { invalidateDashboardQueries } from '../utils/dashboardQueryCache';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[Logout]';

export function useLogout(): () => Promise<void> {
  const clearSession = useAuthStore(state => state.clearSession);
  const setAdminMode = useAdminStore(state => state.setAdminMode);
  const resetSpaceSession = useSpaceStore(state => state.resetSpaceSession);
  const resetMembership = useMemberStore(state => state.reset);

  return useCallback(async () => {
    devLog(`${LOG_TAG} Started`);

    try {
      // Drop owner-scoped Action Center caches before switching accounts on this device.
      invalidateDashboardQueries();
      setAdminMode(false);
      await clearSession();
      resetMembership();
      await resetSpaceSession();
      devLog(`${LOG_TAG} Completed`);
    } catch (err) {
      console.error(`${LOG_TAG} Error during logout`, err);
      invalidateDashboardQueries();
      setAdminMode(false);
      await clearSession();
      resetMembership();
      void resetSpaceSession();
    }

    await new Promise<void>(resolve => {
      InteractionManager.runAfterInteractions(() => resolve());
    });
  }, [clearSession, resetMembership, resetSpaceSession, setAdminMode]);
}
