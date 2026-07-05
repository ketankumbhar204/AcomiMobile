import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import {
  profileCompletionPercentage,
  requiresProfileCompletion,
} from '../utils/profileCompletion';

export function useProfileCompletionGate() {
  const user = useAuthStore(state => state.user);
  const mySpaces = useSpaceStore(state => state.mySpaces);

  return useMemo(() => {
    const blocked = requiresProfileCompletion(user, mySpaces);
    return {
      blocked,
      completionPercentage: profileCompletionPercentage(user),
      user,
    };
  }, [mySpaces, user]);
}
