import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
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
      await clearSession();
      resetMembership();
      await resetSpaceSession();
      console.log(`${LOG_TAG} Completed`);
    } catch (err) {
      console.error(`${LOG_TAG} Error during logout`, err);
      await clearSession();
      resetMembership();
      void resetSpaceSession();
    }

    await new Promise<void>(resolve => {
      InteractionManager.runAfterInteractions(() => resolve());
    });
  }, [clearSession, resetMembership, resetSpaceSession]);
}
