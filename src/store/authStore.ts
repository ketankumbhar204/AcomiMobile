import { create } from 'zustand';
import { setAuthToken } from '../api';
import type { UUID } from '../api/types';

interface AuthState {
  isAuthenticated: boolean;
  userId: UUID | null;
  accessToken: string | null;
  setSession: (userId: UUID, accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  userId: null,
  accessToken: null,

  setSession: (userId, accessToken) => {
    setAuthToken(accessToken);
    set({ isAuthenticated: true, userId, accessToken });
  },

  clearSession: () => {
    setAuthToken(null);
    set({ isAuthenticated: false, userId: null, accessToken: null });
  },
}));
