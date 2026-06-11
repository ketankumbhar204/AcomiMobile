import { useCallback } from 'react';
import { resetToLogin } from '../navigation/navigationRef';
import { useAuthStore } from '../store/authStore';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';

const LOG_TAG = '[Logout]';

export function useLogout(): () => Promise<void> {
  const clearSession = useAuthStore(state => state.clearSession);
  const resetSpaceSession = useSpaceStore(state => state.resetSpaceSession);
  const resetMembership = useMemberStore(state => state.reset);

  return useCallback(async () => {
    console.log(`${LOG_TAG} Started`);

    try {
      console.log(`${LOG_TAG} Clearing session`);
      await clearSession();
      await resetSpaceSession();
      resetMembership();

      console.log(`${LOG_TAG} Navigation reset`);
      resetToLogin();

      console.log(`${LOG_TAG} Completed`);
    } catch (err) {
      console.error(`${LOG_TAG} Error during logout`, err);
      resetToLogin();
      console.log(`${LOG_TAG} Completed`);
    }
  }, [clearSession, resetMembership, resetSpaceSession]);
}
