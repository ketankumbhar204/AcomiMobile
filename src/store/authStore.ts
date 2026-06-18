import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authApi } from '../api/authApi';
import { setAuthToken } from '../api/client';
import type { UserResponse, UUID } from '../api/types';

const TOKEN_KEY = '@countin/access_token';
const USER_KEY = '@countin/user';

const LOG_TAG = '[AuthStore]';

interface AuthState {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  userId: UUID | null;
  user: UserResponse | null;
  accessToken: string | null;

  bootstrap: () => Promise<void>;
  setSession: (user: UserResponse, accessToken: string) => Promise<void>;
  updateUser: (user: UserResponse) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  isBootstrapping: true,
  userId: null,
  user: null,
  accessToken: null,

  bootstrap: async () => {
    if (__DEV__) {
      console.log(`${LOG_TAG} bootstrap starting...`);
    }

    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (__DEV__) {
          console.log(`${LOG_TAG} no stored token -> show login`);
        }

        set({
          isBootstrapping: false,
          isAuthenticated: false,
        });

        return;
      }

      setAuthToken(storedToken);

      if (__DEV__) {
        console.log(`${LOG_TAG} calling GET /auth/me`);
      }

      const user = await authApi.getMe();

      if (__DEV__) {
        console.log(`${LOG_TAG} session restored -> userId:`, user.id);
      }

      set({
        isBootstrapping: false,
        isAuthenticated: true,
        userId: user.id,
        user,
        accessToken: storedToken,
      });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;

      if (__DEV__) {
        console.error(
          `${LOG_TAG} bootstrap failed (status ${status}) -> clearing session`,
          err,
        );
      }

      setAuthToken(null);

      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      set({
        isBootstrapping: false,
        isAuthenticated: false,
        userId: null,
        user: null,
        accessToken: null,
      });
    }
  },

  setSession: async (
    user: UserResponse,
    accessToken: string,
  ): Promise<void> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} setSession -> userId:`, user.id);
    }

    setAuthToken(accessToken);

    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      isAuthenticated: true,
      userId: user.id,
      user,
      accessToken,
    });
  },

  updateUser: async (user: UserResponse): Promise<void> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} updateUser -> userId:`, user.id);
    }

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      user,
      userId: user.id,
    });
  },

  clearSession: async (): Promise<void> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} clearSession`);
    }

    setAuthToken(null);

    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (err) {
      console.error(`${LOG_TAG} clearSession AsyncStorage error`, err);
    }

    set({
      isAuthenticated: false,
      userId: null,
      user: null,
      accessToken: null,
    });
  },
}));